/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  ShieldCheck, Search, Filter, RefreshCcw, 
  Download, AlertCircle, LayoutDashboard, 
  Database, FileText, Settings, HelpCircle,
  ChevronRight, X, FileDown, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  processRawData, RawTemplateData, TemplateVariable, 
  TemplateSummary, DashboardStats, Category, RiskLevel, TemplateType 
} from './lib/analyzer';
import { FileUpload } from './components/FileUpload';
import { SummaryCards, Charts } from './components/Dashboard';
import { TemplateList, VariableTable } from './components/TemplateAnalysis';
import { ReportTemplate } from './components/ReportTemplate';

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
  const reportRef = useRef<HTMLDivElement>(null);

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

  const exportToCSV = () => {
    if (!processedData) return;
    const headers = ['Template', 'Module', 'Object Path', 'Variable', 'Type', 'Categories', 'Flow', 'Count'];
    const rows = processedData.allVariables.map(v => [
      v.template, v.module, v.objectPath, v.variableName, v.type, v.categories.join('|'), v.flow, v.count
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "ccm_template_analysis.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    if (!processedData || !reportRef.current) return;
    
    setIsExportingPDF(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Get all page divs with data-report-page attribute
      const pages = reportRef.current.querySelectorAll('[data-report-page]');
      const pageCount = pages.length;

      if (pageCount === 0) {
        console.error('No pages found in report');
        alert('Error: Could not find report pages');
        return;
      }

      for (let i = 0; i < pageCount; i++) {
        const pageElement = pages[i] as HTMLElement;
        
        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
          windowHeight: 842
        });

        const imgData = canvas.toDataURL('image/png');
        
        if (i > 0) {
          pdf.addPage();
        }

        // A4 dimensions: 210mm x 297mm
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      }

      pdf.save(`CCM_Security_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const resetData = () => {
    setRawData(null);
    setProcessedData(null);
    setSelectedTemplate(null);
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
        <SummaryCards stats={processedData.stats} />
        
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

        <Charts stats={processedData.stats} templateSummaries={processedData.templateSummaries} />

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
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedTemplate.templateName}</h3>
                      <p className="text-sm text-gray-500">
                        Analyzing {showSensitiveOnly ? selectedTemplate.sensitiveCount : selectedTemplate.totalCount} variables
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedTemplate(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  <VariableTable 
                    variables={showSensitiveOnly 
                      ? selectedTemplate.variables.filter(v => v.categories.length > 0) 
                      : selectedTemplate.variables
                    } 
                  />
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

      {/* Hidden Report Template for PDF Export */}
      <div className="absolute left-[-9999px] top-0">
        {processedData && (
          <ReportTemplate 
            ref={reportRef}
            stats={processedData.stats}
            templateSummaries={processedData.templateSummaries}
            allVariables={processedData.allVariables}
            date={new Date().toLocaleDateString()}
          />
        )}
      </div>
    </div>
  );
}
