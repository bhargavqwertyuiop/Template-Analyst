/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Search, Filter, RefreshCcw, 
  Download, AlertCircle, LayoutDashboard, 
  Database, FileText, Settings, HelpCircle,
  ChevronRight, X, FileDown, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import { 
  processRawData, RawTemplateData, TemplateVariable, 
  TemplateSummary, DashboardStats, Category, RiskLevel, TemplateType,
  calculateStats
} from './lib/analyzer';
import { FileUpload } from './components/FileUpload';
import { SummaryCards, Charts } from './components/Dashboard';
import { TemplateList, VariableTable } from './components/TemplateAnalysis';

const RISK_STYLES: Record<RiskLevel, { label: string; bg: string; text: string; border: string }> = {
  HIGH: { label: 'High Risk', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  MEDIUM: { label: 'Medium Risk', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  LOW: { label: 'Low Risk', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  SAFE: { label: 'Safe', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
};

const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  BASE_TEMPLATE: 'Base Template (Master)',
  BLOCK: 'Block',
  SNIPPET: 'Snippet',
  TEMPLATE: 'Template'
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
  const [rawData, setRawData] = useState<RawTemplateData[] | null>(null);
  const [processedData, setProcessedData] = useState<{
    allVariables: TemplateVariable[];
    templateSummaries: TemplateSummary[];
    stats: DashboardStats;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | 'ALL'>('ALL');
  const [selectedTemplateType, setSelectedTemplateType] = useState<TemplateType | 'ALL'>('ALL');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSummary | null>(null);
  const [showSensitiveOnly, setShowSensitiveOnly] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleDataLoaded = (data: RawTemplateData[]) => {
    setRawData(data);
    const processed = processRawData(data);
    setProcessedData(processed);
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
        lines.forEach((line, index) => {
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
      addLine('Prepared by Template Analyst');
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
          name === 'SNIPPET' ? 'Snippet' : 'Template';
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

      const typeOrder = ['BASE_TEMPLATE', 'BLOCK', 'SNIPPET', 'TEMPLATE'];
      
      typeOrder.forEach(type => {
        const templates = templatesByType[type] || [];
        if (templates.length === 0) return;
        
        const typeLabel = type === 'BASE_TEMPLATE' ? 'Base Template (Master)' :
          type === 'BLOCK' ? 'Block' :
          type === 'SNIPPET' ? 'Snippet' : 'Template';
        
        addLine(`${typeLabel} (${templates.length} templates)`);
        
        templates.forEach((template) => {
          addLine(`  • ${template.templateName}`);
          
          template.variables.forEach((variable, varIndex) => {
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

  if (!processedData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-indigo-200 shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Template Analyst</h1>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Security Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                Secure Your CCM Templates
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Upload your Quadient Inspire analysis data to instantly detect PII, financial info, and security risks across your workflows.
              </p>
            </div>
            
            <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-gray-100 overflow-hidden">
              <FileUpload onDataLoaded={handleDataLoaded} />
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Data Extraction</h4>
                <p className="text-sm text-gray-500">Automatically extracts variable names from complex object paths.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Risk Scoring</h4>
                <p className="text-sm text-gray-500">Intelligent categorization and risk assessment based on data sensitivity.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                  <LayoutDashboard className="w-6 h-6 text-amber-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Visual Insights</h4>
                <p className="text-sm text-gray-500">Interactive charts and tables to help you prioritize security fixes.</p>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-indigo-200 shadow-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Template Analyst</h1>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Security Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search templates or variables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64 lg:w-96"
            />
          </div>
          <button 
            onClick={() => { resetData(); setSelectedTemplate(null); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors bg-white border border-gray-200 rounded-xl hover:border-indigo-200"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors bg-white border border-gray-200 rounded-xl hover:border-indigo-200"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={exportToPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            {isExportingPDF ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
        {filteredStats && <SummaryCards stats={filteredStats} />}
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Filters</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2">
              <span className="text-sm font-medium text-gray-600">Sensitive Only</span>
              <button 
                onClick={toggleSensitiveOnly}
                className={`w-10 h-5 rounded-full transition-colors relative ${showSensitiveOnly ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${showSensitiveOnly ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Category | 'ALL')}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {riskOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select 
              value={selectedTemplateType}
              onChange={(e) => setSelectedTemplateType(e.target.value as TemplateType | 'ALL')}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Template Types</option>
              <option value="BASE_TEMPLATE">Base Template (Master)</option>
              <option value="BLOCK">Block</option>
              <option value="SNIPPET">Snippet</option>
              <option value="TEMPLATE">Template</option>
            </select>
          </div>
        </div>

        {filteredStats && <Charts stats={filteredStats} templateSummaries={filteredSummaries} />}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-5">
            <TemplateList 
              risks={filteredSummaries} 
              onSelectTemplate={setSelectedTemplate}
              selectedTemplate={selectedTemplate}
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
                  <div className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-slate-200">
                        <div>
                          <p className="text-xs uppercase tracking-[0.32em] text-indigo-600 font-semibold mb-2">Template Report</p>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedTemplate.templateName}</h3>
                          <p className="text-sm text-gray-600">{selectedTemplateRiskNote}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedTemplate(null)}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Risk level</p>
                          <span className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold ${RISK_STYLES[selectedTemplate.riskLevel].bg} ${RISK_STYLES[selectedTemplate.riskLevel].text}`}>
                            {RISK_STYLES[selectedTemplate.riskLevel].label}
                          </span>
                        </div>
                        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Template type</p>
                          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-2 text-xs font-semibold">
                            {TEMPLATE_TYPE_LABELS[selectedTemplate.templateType]}
                          </span>
                        </div>
                        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Total variables</p>
                          <p className="text-3xl font-bold text-gray-900">{selectedTemplate.totalCount}</p>
                        </div>
                        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Sensitive</p>
                          <p className="text-3xl font-bold text-red-600">{selectedTemplate.sensitiveCount}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Detected categories</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedTemplate.categories.size > 0 ? Array.from(selectedTemplate.categories).map((category: Category) => (
                              <span key={category} className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                                {CATEGORY_LABELS[category]} ({selectedTemplateCategoryBreakdown.get(category) ?? 0})
                              </span>
                            )) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">No sensitive categories detected</span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Template path</p>
                          <p className="text-sm text-gray-700 break-all font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {selectedTemplate.templatePath}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Variables</p>
                      <p className="text-sm text-gray-600 mt-1">
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
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] bg-gray-100/50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center p-12"
                >
                  <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <FileText className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Template</h3>
                  <p className="text-gray-500 max-w-xs">
                    Click on a template from the list to view its sensitive variables and detailed risk assessment.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 p-8 mt-12">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-semibold text-gray-900">CCM Template Analyst v1.0</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Security Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Support</a>
          </div>
          <p className="text-xs text-gray-400">© 2026 Quadient Inspire CCM Security. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
