/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck, Search, Filter, RefreshCcw,
  Download, AlertCircle, LayoutDashboard,
  Database, FileText, Settings,
  Info,
  ChevronRight, X, FileDown, Loader2, Upload,
  LogOut, User as UserIcon, Moon, Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import Papa from 'papaparse';
import logo from './assets/logo.jpg';
import {
  collection, query, where, orderBy, limit,
  getDocs, addDoc, deleteDoc, doc, writeBatch,
  getDocFromServer, onSnapshot
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  processRawData, RawTemplateData, TemplateVariable,
  TemplateSummary, DashboardStats, Category, RiskLevel, TemplateType,
  calculateStats, countDictionaryKeywords, DEFAULT_SENSITIVE_DICTIONARY, Dictionary, DictionaryCsvRow, parseDictionaryCSV, validateDictionaryCSV
} from './lib/analyzer';
import { FileUpload } from './components/FileUpload';
import { InstructionVideo } from './components/InstructionVideo';
import { SummaryCards, Charts } from './components/Dashboard';
import { TemplateList, VariableTable } from './components/TemplateAnalysis';
import { DictionaryManager } from './components/DictionaryManager';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './lib/firebaseUtils';

const RISK_STYLES: Record<RiskLevel, { label: string; bg: string; text: string; border: string }> = {
  HIGH: { label: 'High Risk', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  MEDIUM: { label: 'Medium Risk', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  LOW: { label: 'Low Risk', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  SAFE: { label: 'Safe', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' }
};

const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  BASE_TEMPLATE: 'Base Template (Master)',
  BLOCK: 'Block',
  SNIPPET: 'Snippet',
  TEMPLATE: 'Template',
  OTHER: 'Others'
};

const CATEGORY_LABELS: Record<Category, string> = {
  EMAIL: 'Email',
  PII: 'PII',
  FINANCIAL: 'Financial',
  SECURITY: 'Security',
  CONTACT: 'Contact',
  NONE: 'None'
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [rawData, setRawData] = useState<RawTemplateData[] | null>(null);
  const [processedData, setProcessedData] = useState<{
    allVariables: TemplateVariable[];
    templateSummaries: TemplateSummary[];
    stats: DashboardStats;
  } | null>(null);

  const normalizeHistoryEntry = (entry: any) => {
    const stats = entry?.stats || {};
    return {
      ...entry,
      stats: {
        totalTemplates: Number(stats.totalTemplates ?? 0),
        totalVariables: Number(stats.totalVariables ?? 0),
        sensitiveVariablesCount: Number(stats.sensitiveVariablesCount ?? stats.sensitiveCount ?? 0),
        highRiskCount: Number(stats.highRiskCount ?? 0),
        categoryDistribution: stats.categoryDistribution ?? { EMAIL: 0, PII: 0, FINANCIAL: 0, SECURITY: 0, CONTACT: 0, NONE: 0 },
        typeDistribution: stats.typeDistribution ?? { System: 0, Global: 0, Sensitive: 0, Other: 0 },
        riskDistribution: stats.riskDistribution ?? { HIGH: 0, MEDIUM: 0, LOW: 0, SAFE: 0 },
        templateTypeDistribution: stats.templateTypeDistribution ?? { BASE_TEMPLATE: 0, BLOCK: 0, SNIPPET: 0, TEMPLATE: 0, OTHER: 0 }
      },
      data: entry?.data ?? []
    };
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sensitiveDictionary, setSensitiveDictionary] = useState<Dictionary>(() => {
    const saved = localStorage.getItem('sensitive_dictionary');
    return saved ? JSON.parse(saved) : DEFAULT_SENSITIVE_DICTIONARY;
  });
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | 'ALL'>('ALL');
  const [selectedTemplateType, setSelectedTemplateType] = useState<TemplateType | 'ALL'>('ALL');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSummary | null>(null);
  const [showSensitiveOnly, setShowSensitiveOnly] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isDictionaryManagerOpen, setIsDictionaryManagerOpen] = useState(false);
  const [keywordsUploadWarning, setKeywordsUploadWarning] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [history, setHistory] = useState<Array<{
    id: string;
    timestamp: string;
    fileName: string;
    stats: DashboardStats;
    data: RawTemplateData[];
  }>>(() => {
    const cached = localStorage.getItem('recent_analyses');
    if (!cached) return [];

    try {
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed) ? parsed.map(normalizeHistoryEntry) : [];
    } catch {
      return [];
    }
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isInitialHistoryLoad, setIsInitialHistoryLoad] = useState(true);

  // Test Firestore connection on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('permission-denied'))) {
          console.error("Please check your Firebase configuration and ensure Firestore is enabled with correct rules.");
        }
      }
    }
    testConnection();
  }, []);

  // Fetch history from Firestore with real-time updates and caching
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const path = 'analysisHistory';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    setHistoryLoading(true);

    const unsubscribe = onSnapshot(q, (querySnapshot: any) => {
      const fetchedHistory = querySnapshot.docs.map((doc: any) => {
        const docData = doc.data();
        return normalizeHistoryEntry({
          id: doc.id,
          userId: docData.userId,
          timestamp: docData.timestamp,
          fileName: docData.fileName,
          stats: {
            totalTemplates: docData.totalTemplates,
            sensitiveVariablesCount: docData.sensitiveCount,
            highRiskCount: docData.highRiskCount,
            // Add default values for other stats fields that might be needed
            totalVariables: 0,
            categoryDistribution: {},
            typeDistribution: {},
            riskDistribution: {},
            templateTypeDistribution: {}
          },
          data: JSON.parse(docData.data)
        });
      }) as any[];

      setHistory(fetchedHistory);
      localStorage.setItem('recent_analyses', JSON.stringify(fetchedHistory));
      setHistoryLoading(false);
      setIsInitialHistoryLoad(false);
    }, (error: any) => {
      handleFirestoreError(error, OperationType.GET, path);
      setHistoryLoading(false);
      setIsInitialHistoryLoad(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDataLoaded = async (data: RawTemplateData[], fileName: string = 'Uploaded File') => {
    if (!user) return;

    setRawData(data);
    const processed = processRawData(data, sensitiveDictionary);
    setProcessedData(processed);

    // Add to Firestore history
    const path = 'analysisHistory';
    try {
      const newEntry = {
        userId: user.uid,
        timestamp: new Date().toISOString(),
        fileName,
        totalTemplates: processed.stats.totalTemplates,
        sensitiveCount: processed.stats.sensitiveVariablesCount,
        highRiskCount: processed.stats.highRiskCount,
        data: JSON.stringify(data)
      };
      const docRef = await addDoc(collection(db, path), newEntry);

      // Update local history state
      const historyEntry = {
        id: docRef.id,
        timestamp: newEntry.timestamp,
        fileName: newEntry.fileName,
        stats: {
          totalTemplates: newEntry.totalTemplates,
          totalVariables: processed.stats.totalVariables,
          sensitiveVariablesCount: newEntry.sensitiveCount,
          highRiskCount: newEntry.highRiskCount,
          categoryDistribution: processed.stats.categoryDistribution,
          typeDistribution: processed.stats.typeDistribution,
          riskDistribution: processed.stats.riskDistribution,
          templateTypeDistribution: processed.stats.templateTypeDistribution
        },
        data
      };
      setHistory(prev => {
        if (prev.some(entry => entry.id === historyEntry.id)) return prev;
        return [historyEntry, ...prev];
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const loadFromHistory = (entry: typeof history[0]) => {
    setRawData(entry.data);
    const processed = processRawData(entry.data, sensitiveDictionary);
    setProcessedData(processed);
  };

  const clearHistory = async () => {
    if (!user) return;
    const path = 'analysisHistory';
    try {
      const q = query(collection(db, path), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      setHistory([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      resetData();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDictionaryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<DictionaryCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validationError = validateDictionaryCSV(results.data, results.meta.fields);
        if (validationError) {
          setKeywordsUploadWarning(validationError);
          e.target.value = '';
          return;
        }

        const newDictionary = parseDictionaryCSV(results.data);
        if (countDictionaryKeywords(newDictionary) === 0) {
          setKeywordsUploadWarning('The keywords CSV did not contain any usable keywords.');
          e.target.value = '';
          return;
        }

        saveDictionary(newDictionary);
        setKeywordsUploadWarning(null);
        alert('Keywords updated successfully!');
        e.target.value = '';
      },
      error: (error) => {
        console.error('CSV Parsing Error:', error);
        setKeywordsUploadWarning('Failed to parse keywords CSV.');
        e.target.value = '';
      }
    });
  };

  const saveDictionary = (newDictionary: Dictionary) => {
    setSensitiveDictionary(newDictionary);
    localStorage.setItem('sensitive_dictionary', JSON.stringify(newDictionary));

    // Re-process data if it exists
    if (rawData) {
      const processed = processRawData(rawData, newDictionary);
      setProcessedData(processed);
    }
  };

  const resetDictionary = () => {
    saveDictionary(DEFAULT_SENSITIVE_DICTIONARY);
    localStorage.removeItem('sensitive_dictionary');
  };

  const filteredSummaries = useMemo(() => {
    if (!processedData) return [];
    return processedData.templateSummaries.filter(summary => {
      const matchesSearch = summary.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summary.variables.some(v => v.variableName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'ALL' || summary.categories.has(selectedCategory as Category);
      const matchesRisk = selectedRisk === 'ALL' || summary.riskLevel === selectedRisk;
      const matchesSensitive = !showSensitiveOnly || summary.sensitiveCount > 0;
      const matchesTemplateType = selectedTemplateType === 'ALL' || summary.templateType === selectedTemplateType;
      return matchesSearch && matchesCategory && matchesRisk && matchesSensitive && matchesTemplateType;
    });
  }, [processedData, searchQuery, selectedCategory, selectedRisk, showSensitiveOnly, selectedTemplateType]);

  const filteredStats = useMemo(() => {
    if (!processedData) return null;
    return calculateStats(filteredSummaries);
  }, [processedData, filteredSummaries]);

  const toggleSensitiveOnly = () => {
    const nextShowSensitiveOnly = !showSensitiveOnly;
    if (nextShowSensitiveOnly && selectedRisk === 'SAFE') {
      setSelectedRisk('ALL');
    }
    setShowSensitiveOnly(nextShowSensitiveOnly);
  };

  const riskOptions: Array<{ value: RiskLevel | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'All Risk Levels' },
    { value: 'HIGH', label: 'High Risk' },
    { value: 'MEDIUM', label: 'Medium Risk' },
    { value: 'LOW', label: 'Low Risk' },
    ...(showSensitiveOnly ? [] : [{ value: 'SAFE' as RiskLevel, label: 'Safe' }])
  ];

  const selectedTemplateCategoryBreakdown = useMemo(() => {
    if (!selectedTemplate) return new Map<Category, number>();
    const breakdown = new Map<Category, number>();
    selectedTemplate.variables.forEach(v => {
      v.categories.forEach(cat => {
        breakdown.set(cat, (breakdown.get(cat) || 0) + 1);
      });
    });
    return breakdown;
  }, [selectedTemplate]);

  const selectedTemplateRiskNote = useMemo(() => {
    if (!selectedTemplate) return '';
    const { sensitiveCount, totalCount } = selectedTemplate;
    const percentage = totalCount > 0 ? ((sensitiveCount / totalCount) * 100).toFixed(1) : '0.0';
    return `${percentage}% of variables are sensitive.`;
  }, [selectedTemplate]);

  const exportToCSV = () => {
    if (!processedData || filteredSummaries.length === 0) {
      alert('No data available for export');
      return;
    }

    const headers = ['Template', 'Module', 'Object Path', 'Variable', 'Type', 'Categories', 'Flow', 'Count'];
    const filteredVariables = filteredSummaries.flatMap(s => s.variables);

    const escapeCSV = (val: any) => {
      const stringVal = String(val);
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const rows = filteredVariables.map(v => [
      v.template, v.module, v.objectPath, v.variableName, v.type, v.categories.join('|'), v.flow, v.count
    ].map(escapeCSV));
    const csvContent = [headers.map(escapeCSV), ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ccm_template_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    if (!processedData || !filteredStats || filteredSummaries.length === 0) {
      alert('No data available for export');
      return;
    }

    setIsExportingPDF(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const margin = 15;
      const pageWidth = 210;
      const pageHeight = 297;
      const availableWidth = pageWidth - margin * 2;
      const lineHeight = 6;
      let cursorY = margin;

      const nextPage = () => {
        pdf.addPage();
        cursorY = margin;
      };

      const addLine = (text: string, options: { align?: 'left' | 'center' | 'right' } = {}) => {
        const lines = pdf.splitTextToSize(text, availableWidth);
        lines.forEach((line: string, index: number) => {
          if (cursorY + lineHeight > pageHeight - margin) {
            nextPage();
          }
          pdf.text(line, margin, cursorY, { align: options.align || 'left' });
          cursorY += lineHeight;
        });
      };

      const addSectionTitle = (title: string) => {
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        addLine(title);
        cursorY += 2;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
      };

      const addKeyValue = (key: string, value: string | number) => {
        addLine(`${key}: ${value}`);
      };

      addSectionTitle('Template Variable Analysis Report');
      addLine(`Generated: ${new Date().toLocaleDateString()}`);
      addLine('Prepared by Guardient');
      if (searchQuery) addLine(`Search Filter: "${searchQuery}"`);
      cursorY += 2;
      addKeyValue('Total Templates', filteredStats.totalTemplates);
      addKeyValue('Total Variables', filteredStats.totalVariables);
      addKeyValue('Sensitive Variables', filteredStats.sensitiveVariablesCount);
      addKeyValue('High Risk Templates', filteredStats.highRiskCount);
      addLine('');

      addSectionTitle('Report Summary');
      addLine('This report provides an executive overview of template risk exposure and sensitive variable findings for the filtered CCM dataset.');
      addLine('');

      addSectionTitle('Risk Distribution');
      Object.entries(filteredStats.riskDistribution).forEach(([name, value]) => {
        addLine(`• ${name}: ${value}`);
      });
      addLine('');

      addSectionTitle('Template Type Distribution');
      Object.entries(filteredStats.templateTypeDistribution).forEach(([name, value]) => {
        const label = name === 'BASE_TEMPLATE' ? 'Base Template (Master)' :
          name === 'BLOCK' ? 'Block' :
            name === 'SNIPPET' ? 'Snippet' :
              name === 'TEMPLATE' ? 'Template' : 'Others';
        addLine(`• ${label}: ${value}`);
      });
      addLine('');

      addSectionTitle('Templates by Type');

      const templatesByType: Record<string, TemplateSummary[]> = {};
      filteredSummaries.forEach(template => {
        if (!templatesByType[template.templateType]) {
          templatesByType[template.templateType] = [];
        }
        templatesByType[template.templateType].push(template);
      });

      const typeOrder = ['BASE_TEMPLATE', 'BLOCK', 'SNIPPET', 'TEMPLATE', 'OTHER'];

      typeOrder.forEach(type => {
        const templates = templatesByType[type] || [];
        if (templates.length === 0) return;

        const typeLabel = type === 'BASE_TEMPLATE' ? 'Base Template (Master)' :
          type === 'BLOCK' ? 'Block' :
            type === 'SNIPPET' ? 'Snippet' :
              type === 'TEMPLATE' ? 'Template' : 'Others';

        addLine(`${typeLabel} (${templates.length} templates)`);

        templates.forEach((template: TemplateSummary) => {
          addLine(`  • ${template.templateName}`);

          template.variables.forEach((variable: TemplateVariable, varIndex: number) => {
            const flowInfo = variable.flow ? ` [Flow: ${variable.flow}]` : '';
            const categoryInfo = variable.categories.length > 0 ? ` [${variable.categories.join(', ')}]` : '';
            addLine(`    ${varIndex + 1}. ${variable.variableName}${flowInfo}${categoryInfo}`);
          });

          addLine('');
        });
      });

      pdf.save(`CCM_Security_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const resetData = () => {
    try {
      setRawData(null);
      setProcessedData(null);
      setSelectedTemplate(null);
      setSearchQuery('');
      setSelectedCategory('ALL');
      setSelectedRisk('ALL');
      setShowSensitiveOnly(false);
      setSelectedTemplateType('ALL');
    } catch (error) {
      console.error('Error resetting data:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gray-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return isSignup ? (
      <Signup onSwitchToLogin={() => setIsSignup(false)} />
    ) : (
      <Login onSwitchToSignup={() => setIsSignup(true)} />
    );
  }

  if (!processedData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col text-gray-900 dark:text-white">
        <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-50 gap-3">
          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="h-12 sm:h-14 lg:h-16 overflow-hidden">
              <img src={logo} alt="Guardient logo" className="h-[330%] w-auto max-w-none object-cover object-left -mt-16 sm:-mt-17 dark:invert dark:hue-rotate-180 dark:mix-blend-screen" />
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
              <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[11px] font-semibold text-gray-900 dark:text-gray-200">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-full uppercase tracking-wide transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                Secure Your CCM Templates
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Upload your Quadient Inspire analysis data to instantly detect PII, financial info, and security risks across your workflows.
              </p>
            </div>

            <InstructionVideo />

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
              <FileUpload onDataLoaded={handleDataLoaded} />
            </div>

            {(!authLoading && !rawData) && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Analyses</h3>
                  {history.length > 0 && (
                    <button onClick={clearHistory} className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider">Clear History</button>
                  )}
                </div>

                {historyLoading && isInitialHistoryLoad ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm animate-pulse">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                            <div className="space-y-2">
                            <div className="w-24 h-3 bg-gray-100 dark:bg-gray-700 rounded" />
                            <div className="w-16 h-2 bg-gray-50 dark:bg-gray-700/50 rounded" />
                            </div>
                          </div>
                        <div className="w-4 h-4 bg-gray-50 dark:bg-gray-700/50 rounded" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                        <div className="h-10 bg-gray-50 dark:bg-gray-700/50 rounded-xl" />
                        <div className="h-10 bg-gray-50 dark:bg-gray-700/50 rounded-xl" />
                        <div className="h-10 bg-gray-50 dark:bg-gray-700/50 rounded-xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : history.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {history.map(entry => (
                      <button
                        key={entry.id}
                        onClick={() => loadFromHistory(entry)}
                    className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 group-hover:bg-gray-800 dark:group-hover:bg-gray-600 group-hover:text-white transition-colors">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{entry.fileName}</p>
                              <p className="text-[10px] text-gray-400">{new Date(entry.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-800 transition-colors" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Templates</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{entry.stats?.totalTemplates ?? 0}</p>
                          </div>
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Sensitive</p>
                          <p className="text-sm font-bold text-red-600 dark:text-red-400">{entry.stats?.sensitiveVariablesCount ?? 0}</p>
                          </div>
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p className="text-[9px] font-bold text-gray-400 uppercase">High Risk</p>
                          <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{entry.stats?.highRiskCount ?? 0}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                <div className="p-12 bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No history available</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Upload a file to start your first analysis.</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Data Extraction</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Automatically extracts variable names from complex object paths.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Risk Scoring</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Intelligent categorization and risk assessment based on data sensitivity.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                <LayoutDashboard className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Visual Insights</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Interactive charts and tables to help you prioritize security fixes.</p>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col text-gray-900 dark:text-white">
      <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col lg:flex-row items-center justify-between sticky top-0 z-50 gap-3">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="h-10 sm:h-12 lg:h-14 shrink-0">
            <img src={logo} alt="Guardient logo" className="h-full w-auto object-contain dark:invert dark:hue-rotate-180 dark:mix-blend-screen" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full sm:w-64 lg:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-gray-600 transition-colors" />
            <input
              type="text"
              placeholder="Search templates or variables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 dark:text-white transition-all w-full"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 rounded-full cursor-pointer border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 h-9" title="Upload keywords CSV with columns: Category and Keyword">
                <Upload className="w-3 h-3" />
                Upload Keywords CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleDictionaryUpload} />
              </label>
              <button
                onClick={() => setIsDictionaryManagerOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 h-9"
              >
                <Settings className="w-3 h-3" />
                Manage Keywords
              </button>
            </div>
            <a
              href={`${import.meta.env.BASE_URL}keyword-template.csv`}
              download
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Download the keywords CSV template"
            >
              <Info className="w-3.5 h-3.5" />
              Keywords CSV template
            </a>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 h-9">
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.18em]">
                Variables
              </span>
            <span className="inline-flex items-center rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2.5 py-1 text-[11px] font-semibold text-gray-800 dark:text-gray-200 leading-none">
                {countDictionaryKeywords(sensitiveDictionary)}
              </span>
              {localStorage.getItem('sensitive_dictionary') && (
                <button
                  onClick={resetDictionary}
                className="px-2 py-1 text-[10px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full font-semibold uppercase tracking-wide transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { resetData(); setSelectedTemplate(null); }}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Reset View"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button
              onClick={exportToCSV}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={exportToPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-800 hover:bg-gray-900 transition-all rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed h-9"
            >
              {isExportingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {isExportingPDF ? '...' : 'PDF'}
            </button>
          </div>

          <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 h-9">
            <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
              <UserIcon className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-semibold text-gray-900 dark:text-gray-200 truncate max-w-[96px]">{user.email}</p>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 text-[9px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-full uppercase tracking-wide transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
        {filteredStats && (
          <SummaryCards
            stats={filteredStats}
          />
        )}

        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filters</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 flex-1 md:flex-none justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Sensitive Only</span>
              <button
                onClick={toggleSensitiveOnly}
              className={`w-10 h-5 rounded-full transition-colors relative ${showSensitiveOnly ? 'bg-gray-800 dark:bg-gray-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${showSensitiveOnly ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Category | 'ALL')}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 flex-1 md:flex-none dark:text-white"
            >
              <option value="ALL">All Categories</option>
              <option value="EMAIL">Email</option>
              <option value="PII">PII</option>
              <option value="FINANCIAL">Financial</option>
              <option value="SECURITY">Security</option>
              <option value="CONTACT">Contact</option>
            </select>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value as RiskLevel | 'ALL')}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 flex-1 md:flex-none dark:text-white"
            >
              {riskOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={selectedTemplateType}
              onChange={(e) => setSelectedTemplateType(e.target.value as TemplateType | 'ALL')}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 flex-1 md:flex-none dark:text-white"
            >
              <option value="ALL">All Template Types</option>
              <option value="BASE_TEMPLATE">Base Template (Master)</option>
              <option value="BLOCK">Block</option>
              <option value="SNIPPET">Snippet</option>
              <option value="TEMPLATE">Template</option>
              <option value="OTHER">Others</option>
            </select>
          </div>
        </div>

        {filteredStats && (
          <Charts
            stats={filteredStats}
            templateSummaries={filteredSummaries}
            isDarkMode={isDarkMode}
          />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-5">
            <TemplateList
              risks={filteredSummaries}
              onSelectTemplate={setSelectedTemplate}
              selectedTemplate={selectedTemplate}
              searchQuery={searchQuery}
            />
          </div>
          <div className="xl:col-span-7">
            <AnimatePresence mode="wait">
              {selectedTemplate ? (
                <motion.div
                  key={selectedTemplate.templateName}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
              <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-800/90 p-8 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm">
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-slate-200">
                        <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-gray-600 dark:text-gray-400 font-semibold mb-2">Template Report</p>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedTemplate.templateName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{selectedTemplateRiskNote}</p>
                        </div>
                        <button
                          onClick={() => setSelectedTemplate(null)}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Risk level</p>
                          <span className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold ${RISK_STYLES[selectedTemplate.riskLevel].bg} ${RISK_STYLES[selectedTemplate.riskLevel].text}`}>
                            {RISK_STYLES[selectedTemplate.riskLevel].label}
                          </span>
                        </div>
                    <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Template type</p>
                          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-2 text-xs font-semibold">
                            {TEMPLATE_TYPE_LABELS[selectedTemplate.templateType]}
                          </span>
                        </div>
                    <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Total variables</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{selectedTemplate.totalCount}</p>
                        </div>
                    <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Sensitive</p>
                          <p className="text-3xl font-bold text-red-600">{selectedTemplate.sensitiveCount}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Detected categories</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedTemplate.categories.size > 0 ? Array.from(selectedTemplate.categories).map((category: Category) => (
                              <span key={category} className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                              <span className="dark:text-gray-800">{CATEGORY_LABELS[category]} ({selectedTemplateCategoryBreakdown.get(category) ?? 0})</span>
                              </span>
                            )) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">No sensitive categories detected</span>
                            )}
                          </div>
                        </div>

                    <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Template path</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-all font-mono bg-slate-50 dark:bg-gray-900 p-3 rounded-xl border border-slate-100 dark:border-gray-700">
                            {selectedTemplate.templatePath}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-white dark:to-gray-800">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Variables</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {showSensitiveOnly ? 'Sensitive variables only' : 'All variables'} (
                        {showSensitiveOnly ? selectedTemplate.variables.filter(v => v.categories.length > 0).length : selectedTemplate.variables.length}
                        )
                      </p>
                    </div>
                    <VariableTable
                      variables={showSensitiveOnly
                        ? selectedTemplate.variables.filter(v => v.categories.length > 0)
                        : selectedTemplate.variables
                      }
                      searchQuery={searchQuery}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                className="h-full min-h-[400px] bg-gray-100/50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center text-center p-12"
                >
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm mb-4">
                    <FileText className="w-8 h-8 text-gray-300" />
                  </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a Template</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                    Click on a template from the list to view its sensitive variables and detailed risk assessment.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-8 mt-12">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Guardient v1.0</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-gray-500">
            <a href="https://github.com/bhargavqwertyuiop/Template-Analyst" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Documentation</a>
            <button onClick={() => setIsAboutOpen(true)} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">About</button>
          </div>
          <p className="text-xs text-gray-400">© 2026 Quadient Inspire CCM Security. All rights reserved.</p>
        </div>
      </footer>

      {isDictionaryManagerOpen && (
        <DictionaryManager
          dictionary={sensitiveDictionary}
          onSave={saveDictionary}
          onClose={() => setIsDictionaryManagerOpen(false)}
          onReset={resetDictionary}
        />
      )}

      {isAboutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">About Guardient</h2>
                  <button onClick={() => setIsAboutOpen(false)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <ShieldCheck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Guardient v1.0</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Secure your Quadient Inspire templates with intelligent risk detection</p>
              </div>

                <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Development Team</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Pratiksha</span>
                    <span className="text-xs text-gray-500">pratiksha@example.com</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Subhrajyoti</span>
                    <span className="text-xs text-gray-500">subhrajyoti@example.com</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Vinothh</span>
                    <span className="text-xs text-gray-500">vinothh@example.com</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Bhargav</span>
                    <span className="text-xs text-gray-500">bhargav@example.com</span>
                  </div>
                </div>
              </div>

                <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
                <p className="text-xs text-gray-400 text-center">
                  © 2026 Quadient Inspire CCM Security. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {keywordsUploadWarning && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-800 shadow-2xl border border-amber-100 dark:border-amber-900/50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-6 py-4">
                <div className="flex items-center gap-3 text-amber-800 dark:text-amber-500">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-gray-800 border border-amber-100 dark:border-amber-900/50">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-base font-bold dark:text-amber-400">Keywords CSV warning</h3>
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-500">The uploaded file was not applied.</p>
                </div>
              </div>
              <button
                onClick={() => setKeywordsUploadWarning(null)}
                  className="rounded-full p-2 text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                aria-label="Close warning"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5">
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{keywordsUploadWarning}</p>
            </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => setKeywordsUploadWarning(null)}
                  className="rounded-full bg-gray-800 dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
