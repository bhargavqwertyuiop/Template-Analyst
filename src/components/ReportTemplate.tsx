/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Calendar, TrendingUp, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { DashboardStats, TemplateSummary, TemplateVariable, Category, RiskLevel, VariableType, TemplateType } from '../lib/analyzer';
import { CATEGORY_COLORS, CATEGORY_ICONS, TYPE_COLORS } from './Dashboard';

interface ReportTemplateProps {
  stats: DashboardStats;
  templateSummaries: TemplateSummary[];
  allVariables: TemplateVariable[];
  date: string;
}

export const ReportTemplate = React.forwardRef<HTMLDivElement, ReportTemplateProps>(({ stats, templateSummaries, allVariables, date }, ref) => {
  const sensitiveVariables = allVariables.filter(v => v.categories.length > 0);
  
  const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; label: string }> = {
    HIGH: { color: 'text-pdf-red-700', bg: 'bg-pdf-red-50', label: 'High Risk' },
    MEDIUM: { color: 'text-pdf-amber-700', bg: 'bg-pdf-amber-50', label: 'Medium Risk' },
    LOW: { color: 'text-pdf-blue-700', bg: 'bg-pdf-blue-50', label: 'Low Risk' },
    SAFE: { color: 'text-pdf-emerald-700', bg: 'bg-pdf-emerald-50', label: 'Safe' }
  };

  const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
    BASE_TEMPLATE: 'Base Template (Master)',
    BLOCK: 'Block',
    SNIPPET: 'Snippet',
    TEMPLATE: 'Template'
  };

  const riskDistribution = stats.riskDistribution;
  const templateTypeDistribution = stats.templateTypeDistribution;

  return (
    <div ref={ref} className="bg-white font-sans text-pdf-gray-900">
      {/* Page 1: Title Page */}
      <div className="w-[1000px] h-screen mx-auto p-12 flex flex-col justify-between border-b-2 border-pdf-indigo-600">
        <div className="flex flex-col justify-center items-center space-y-8 flex-1">
          <div className="bg-pdf-indigo-600 p-6 rounded-2xl">
            <ShieldCheck className="w-20 h-20 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-black text-pdf-gray-900 mb-4 tracking-tight">Template Variable Analysis Report</h1>
            <p className="text-xl text-pdf-gray-500 mb-2">Comprehensive Security Assessment for Customer Communication Templates</p>
            <p className="text-sm text-pdf-gray-400 flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" /> Generated on {date}
            </p>
          </div>
        </div>
        <div className="text-center space-y-2 pt-8 border-t border-pdf-gray-200">
          <p className="text-xs font-bold text-pdf-indigo-600 uppercase tracking-widest">Confidential - Security Audit</p>
          <p className="text-sm text-pdf-gray-400">CCM Template Analyst v1.0 | Quadient Inspire Security</p>
        </div>
      </div>

      {/* Page 2: Executive Summary & Key Metrics */}
      <div className="w-[1000px] mx-auto p-12 min-h-screen space-y-8 border-b-2 border-pdf-indigo-600">
        <h1 className="text-3xl font-bold text-pdf-gray-900 border-l-4 border-pdf-indigo-600 pl-4">Executive Summary</h1>
        
        <div className="card bg-pdf-blue-50 border border-pdf-blue-100 p-6 rounded-xl">
          <p className="text-pdf-gray-700 leading-relaxed mb-4">
            This comprehensive report analyzes {stats.totalTemplates} customer communication templates to identify and assess data sensitivity risks. The analysis provides insights into template composition, variable classification, and risk distribution to guide compliance and security practices.
          </p>
          <p className="text-pdf-gray-700 leading-relaxed">
            Key Insight: {stats.sensitiveVariablesCount} sensitive variables detected across templates, with {stats.highRiskCount} templates requiring immediate attention.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 bg-pdf-gray-50 rounded-xl border border-pdf-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-pdf-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-pdf-gray-600">Total Templates</span>
            </div>
            <p className="text-4xl font-bold text-pdf-gray-900">{stats.totalTemplates}</p>
            <p className="text-xs text-pdf-gray-500 mt-2">Communication flows analyzed</p>
          </div>
          <div className="p-6 bg-pdf-gray-50 rounded-xl border border-pdf-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-pdf-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-pdf-gray-600">Sensitive Variables</span>
            </div>
            <p className="text-4xl font-bold text-pdf-gray-900">{stats.sensitiveVariablesCount}</p>
            <p className="text-xs text-pdf-gray-500 mt-2">Requiring data protection measures</p>
          </div>
          <div className="p-6 bg-pdf-gray-50 rounded-xl border border-pdf-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-pdf-red-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-pdf-gray-600">High Risk</span>
            </div>
            <p className="text-4xl font-bold text-pdf-gray-900">{stats.highRiskCount}</p>
            <p className="text-xs text-pdf-gray-500 mt-2">Templates needing remediation</p>
          </div>
          <div className="p-6 bg-pdf-gray-50 rounded-xl border border-pdf-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-pdf-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-pdf-gray-600">Safe Templates</span>
            </div>
            <p className="text-4xl font-bold text-pdf-gray-900">{stats.totalTemplates - stats.highRiskCount}</p>
            <p className="text-xs text-pdf-gray-500 mt-2">Compliant communication flows</p>
          </div>
        </div>
      </div>

      {/* Page 3: Risk Distribution Overview */}
      <div className="w-[1000px] mx-auto p-12 min-h-screen space-y-8 border-b-2 border-pdf-indigo-600">
        <h1 className="text-3xl font-bold text-pdf-gray-900 border-l-4 border-pdf-indigo-600 pl-4">Risk Distribution Analysis</h1>
        
        <div className="grid grid-cols-2 gap-8">
          <div className="border border-pdf-gray-100 rounded-xl p-6 bg-pdf-gray-50">
            <h3 className="text-sm font-bold text-pdf-gray-700 uppercase mb-6 tracking-wider">Risk Level Distribution</h3>
            <div className="space-y-4">
              {Object.entries(riskDistribution).map(([level, count]) => (
                <div key={level}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-pdf-gray-700">{RISK_CONFIG[level as RiskLevel].label}</span>
                    <span className="text-lg font-bold">{count}</span>
                  </div>
                  <div className="bg-pdf-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${((count as number) / stats.totalTemplates) * 100}%`,
                        backgroundColor: {
                          HIGH: '#dc2626',
                          MEDIUM: '#f59e0b',
                          LOW: '#3b82f6',
                          SAFE: '#10b981'
                        }[level as RiskLevel]
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-pdf-gray-100 rounded-xl p-6 bg-pdf-gray-50">
            <h3 className="text-sm font-bold text-pdf-gray-700 uppercase mb-6 tracking-wider">Template Type Distribution</h3>
            <div className="space-y-4">
              {Object.entries(templateTypeDistribution).map(([type, count]) => (
                <div key={type}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-pdf-gray-700">{TEMPLATE_TYPE_LABELS[type as TemplateType]}</span>
                    <span className="text-lg font-bold">{count}</span>
                  </div>
                  <div className="bg-pdf-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${((count as number) / stats.totalTemplates) * 100}%`,
                        backgroundColor: {
                          BASE_TEMPLATE: '#a78bfa',
                          BLOCK: '#60a5fa',
                          SNIPPET: '#34d399',
                          TEMPLATE: '#fbbf24'
                        }[type as TemplateType]
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-pdf-gray-100 rounded-xl p-6 bg-white mt-8">
          <h3 className="text-sm font-bold text-pdf-gray-700 uppercase mb-4 tracking-wider">Sensitive Data Categories</h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(stats.categoryDistribution).map(([cat, count]) => (count as number) > 0 && (
              <div key={cat} className="flex items-center gap-3 p-3 bg-pdf-gray-50 rounded-lg">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat as Category] }} />
                <div>
                  <p className="text-xs font-bold text-pdf-gray-600 uppercase">{cat}</p>
                  <p className="text-lg font-bold text-pdf-gray-900">{count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page 4: Template Risk Assessment */}
      <div className="w-[1000px] mx-auto p-12 min-h-screen space-y-8 border-b-2 border-pdf-indigo-600">
        <h1 className="text-3xl font-bold text-pdf-gray-900 border-l-4 border-pdf-indigo-600 pl-4">Template Risk Assessment</h1>
        <p className="text-sm text-pdf-gray-600">Detailed analysis of all templates with sensitive variables, sorted by risk level and sensitivity count.</p>
        
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-pdf-indigo-600 text-white">
              <th className="px-3 py-3 text-left font-bold">Template</th>
              <th className="px-3 py-3 text-left font-bold">Type</th>
              <th className="px-3 py-3 text-center font-bold">Risk</th>
              <th className="px-3 py-3 text-center font-bold">Sensitive</th>
              <th className="px-3 py-3 text-center font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pdf-gray-200">
            {templateSummaries.sort((a, b) => {
              if (a.riskLevel !== b.riskLevel) {
                const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2, SAFE: 3 };
                return riskOrder[a.riskLevel as RiskLevel] - riskOrder[b.riskLevel as RiskLevel];
              }
              return b.sensitiveCount - a.sensitiveCount;
            }).slice(0, 20).map((summary, i) => {
              const config = RISK_CONFIG[summary.riskLevel];
              return (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-pdf-gray-50'}>
                  <td className="px-3 py-2 font-medium">{summary.templateName}</td>
                  <td className="px-3 py-2 text-xs">{TEMPLATE_TYPE_LABELS[summary.templateType]}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-pdf-red-600">{summary.sensitiveCount}</td>
                  <td className="px-3 py-2 text-center">{summary.totalCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Page 5: Sensitive Data Journey */}
      <div className="w-[1000px] mx-auto p-12 min-h-screen space-y-8 border-b-2 border-pdf-indigo-600">
        <h1 className="text-3xl font-bold text-pdf-gray-900 border-l-4 border-pdf-indigo-600 pl-4">Sensitive Data Journey</h1>
        <p className="text-sm text-pdf-gray-600">Flow analysis of sensitive variables through customer communication templates.</p>
        
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-pdf-indigo-600 text-white">
              <th className="px-3 py-3 text-left font-bold">Variable</th>
              <th className="px-3 py-3 text-left font-bold">Template</th>
              <th className="px-3 py-3 text-left font-bold">Data Type</th>
              <th className="px-3 py-3 text-left font-bold">Category</th>
              <th className="px-3 py-3 text-center font-bold">Usage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pdf-gray-200">
            {sensitiveVariables.slice(0, 25).map((v, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-pdf-gray-50'}>
                <td className="px-3 py-2 font-mono text-pdf-indigo-600 font-bold text-xs">{v.variableName}</td>
                <td className="px-3 py-2 text-xs">{v.template}</td>
                <td className="px-3 py-2 text-xs uppercase tracking-wider">{v.type}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[v.categories[0] as Category] }} />
                    <span className="text-xs font-medium">{v.categories[0]}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center font-bold">{v.count}x</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sensitiveVariables.length > 25 && (
          <p className="text-xs text-pdf-gray-500 mt-4 italic">
            + {sensitiveVariables.length - 25} more sensitive findings (see detailed appendix)
          </p>
        )}
      </div>

      {/* Page 6: Recommendations & Compliance Notes */}
      <div className="w-[1000px] mx-auto p-12 min-h-screen space-y-8">
        <h1 className="text-3xl font-bold text-pdf-gray-900 border-l-4 border-pdf-indigo-600 pl-4">Recommendations & Next Steps</h1>
        
        <div className="space-y-4">
          <div className="border-l-4 border-pdf-red-500 bg-pdf-red-50 p-6 rounded-r-lg">
            <h3 className="font-bold text-pdf-red-900 mb-2">🔴 High Priority - High Risk Templates</h3>
            <p className="text-pdf-red-700 text-sm">Review and remediate {stats.highRiskCount} templates containing sensitive financial or security data. Implement additional encryption and access controls.</p>
          </div>
          
          <div className="border-l-4 border-pdf-amber-500 bg-pdf-amber-50 p-6 rounded-r-lg">
            <h3 className="font-bold text-pdf-amber-900 mb-2">🟡 Medium Priority - Medium Risk Templates</h3>
            <p className="text-pdf-amber-700 text-sm">Audit medium-risk templates containing personally identifiable information (PII) and enhance data masking policies.</p>
          </div>
          
          <div className="border-l-4 border-pdf-blue-500 bg-pdf-blue-50 p-6 rounded-r-lg">
            <h3 className="font-bold text-pdf-blue-900 mb-2">🔵 Low Priority - Low Risk Templates</h3>
            <p className="text-pdf-blue-700 text-sm">Monitor low-risk templates for changes and ensure standard security practices are maintained.</p>
          </div>
          
          <div className="border-l-4 border-pdf-emerald-500 bg-pdf-emerald-50 p-6 rounded-r-lg">
            <h3 className="font-bold text-pdf-emerald-900 mb-2">✅ Compliant - Safe Templates</h3>
            <p className="text-pdf-emerald-700 text-sm">Templates contain no sensitive data and meet baseline security requirements. Continue regular compliance audits.</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-pdf-gray-200 space-y-4">
          <p className="text-sm text-pdf-gray-700 font-semibold">Best Practices for Customer Journey Optimization:</p>
          <ul className="text-sm text-pdf-gray-600 space-y-2">
            <li>• Implement role-based access control (RBAC) for templates handling sensitive customer data</li>
            <li>• Establish data retention policies aligned with privacy regulations (GDPR, CCPA)</li>
            <li>• Conduct quarterly security reviews of template variables and data flows</li>
            <li>• Provide staff training on data sensitivity and secure template handling</li>
            <li>• Maintain audit logs for all template modifications and data access</li>
          </ul>
        </div>

        <div className="mt-12 pt-8 border-t-2 border-pdf-gray-300 flex justify-between items-end text-pdf-gray-400 text-xs">
          <p>Template Analytics Security Report</p>
          <p>© 2026 Quadient Inspire CCM</p>
        </div>
      </div>
    </div>
  );
});

ReportTemplate.displayName = 'ReportTemplate';
