/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Calendar, Database, Layout, ShieldAlert, AlertTriangle } from 'lucide-react';
import { DashboardStats, TemplateSummary, TemplateVariable, Category, RiskLevel, VariableType } from '../lib/analyzer';
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

  return (
    <div ref={ref} className="bg-white p-12 w-[1000px] mx-auto text-pdf-gray-900 font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-start border-b-2 border-pdf-indigo-600 pb-8 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-pdf-indigo-600 p-2 rounded-xl">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-pdf-gray-900 tracking-tight">Template Variable Analysis Report</h1>
          </div>
          <p className="text-pdf-gray-500 font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Generated on {date}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-pdf-indigo-600 uppercase tracking-widest mb-1">Confidential Security Audit</p>
          <p className="text-sm text-pdf-gray-400">CCM Template Analyst v1.0</p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-pdf-gray-50 rounded-2xl border border-pdf-gray-100">
          <div className="flex items-center gap-2 text-pdf-blue-600 mb-2">
            <Layout className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Templates</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalTemplates}</p>
        </div>
        <div className="p-6 bg-pdf-gray-50 rounded-2xl border border-pdf-gray-100">
          <div className="flex items-center gap-2 text-pdf-indigo-600 mb-2">
            <Database className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Variables</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalVariables}</p>
        </div>
        <div className="p-6 bg-pdf-gray-50 rounded-2xl border border-pdf-gray-100">
          <div className="flex items-center gap-2 text-pdf-amber-600 mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Sensitive Variables</span>
          </div>
          <p className="text-3xl font-bold">{stats.sensitiveVariablesCount}</p>
        </div>
        <div className="p-6 bg-pdf-gray-50 rounded-2xl border border-pdf-gray-100">
          <div className="flex items-center gap-2 text-pdf-red-600 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">High Risk Templates</span>
          </div>
          <p className="text-3xl font-bold">{stats.highRiskCount}</p>
        </div>
      </div>

      {/* Charts Section Placeholder (Charts will be captured from dashboard or re-rendered here) */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-pdf-gray-900 mb-6 border-l-4 border-pdf-indigo-600 pl-4">Visual Analysis</h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="border border-pdf-gray-100 rounded-2xl p-6 bg-white shadow-sm">
            <h3 className="text-sm font-bold text-pdf-gray-500 uppercase mb-4">Sensitive Category Distribution</h3>
            <div className="space-y-3">
              {(Object.entries(stats.categoryDistribution) as [Category, number][])
                .filter(([name, value]) => name !== 'NONE' && value > 0)
                .map(([name, value]) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[name] }} />
                      <span className="text-sm font-medium">{name}</span>
                    </div>
                    <span className="text-sm font-bold">{value}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="border border-pdf-gray-100 rounded-2xl p-6 bg-white shadow-sm">
            <h3 className="text-sm font-bold text-pdf-gray-500 uppercase mb-4">Variable Type Distribution</h3>
            <div className="space-y-3">
              {(Object.entries(stats.typeDistribution) as [VariableType, number][]).map(([name, value]) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[name] }} />
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  <span className="text-sm font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Analysis Table */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-pdf-gray-900 mb-6 border-l-4 border-pdf-indigo-600 pl-4">Template Risk Assessment</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-pdf-gray-50 text-pdf-gray-500 uppercase text-[10px] tracking-wider font-bold">
              <th className="px-4 py-3 border-b border-pdf-gray-100">Template Name</th>
              <th className="px-4 py-3 border-b border-pdf-gray-100">Risk Level</th>
              <th className="px-4 py-3 border-b border-pdf-gray-100">Sensitive Count</th>
              <th className="px-4 py-3 border-b border-pdf-gray-100">Categories</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pdf-gray-50">
            {templateSummaries.sort((a, b) => b.sensitiveCount - a.sensitiveCount).slice(0, 15).map((summary, i) => {
              const config = RISK_CONFIG[summary.riskLevel];
              return (
                <tr key={i}>
                  <td className="px-4 py-3 font-medium text-pdf-gray-900">{summary.templateName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold">{summary.sensitiveCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {Array.from(summary.categories).map((cat, idx) => (
                        <div key={idx} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ color: CATEGORY_COLORS[cat as Category] }}>
                          {CATEGORY_ICONS[cat as Category]}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sensitive Findings Table */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-pdf-gray-900 mb-6 border-l-4 border-pdf-indigo-600 pl-4">Sensitive Data Findings</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-pdf-gray-50 text-pdf-gray-500 uppercase text-[10px] tracking-wider font-bold">
              <th className="px-4 py-3 border-b border-pdf-gray-100">Template</th>
              <th className="px-4 py-3 border-b border-pdf-gray-100">Variable</th>
              <th className="px-4 py-3 border-b border-pdf-gray-100">Category</th>
              <th className="px-4 py-3 border-b border-pdf-gray-100">Flow</th>
              <th className="px-4 py-3 border-b border-pdf-gray-100">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pdf-gray-50">
            {sensitiveVariables.slice(0, 30).map((v, i) => (
              <tr key={i}>
                <td className="px-4 py-3 text-xs text-pdf-gray-500">{v.template}</td>
                <td className="px-4 py-3 font-mono text-pdf-indigo-600 font-bold">{v.variableName}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs font-medium" style={{ color: CATEGORY_COLORS[v.categories[0] as Category] }}>
                    {CATEGORY_ICONS[v.categories[0] as Category]}
                    {v.categories[0]}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-pdf-gray-500">{v.flow}</td>
                <td className="px-4 py-3 font-bold">{v.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sensitiveVariables.length > 30 && (
          <p className="text-xs text-pdf-gray-400 mt-4 text-center italic">
            Showing first 30 of {sensitiveVariables.length} sensitive findings. See CSV export for full details.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-pdf-gray-100 pt-8 mt-12 flex justify-between items-center text-pdf-gray-400 text-xs">
        <p>Generated by Template Analytics Tool</p>
        <p>Page 1 of 1</p>
        <p>© 2026 Quadient Inspire CCM Security</p>
      </div>
    </div>
  );
});
