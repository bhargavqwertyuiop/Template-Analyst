/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Calendar } from 'lucide-react';
import { DashboardStats, TemplateSummary, TemplateVariable, Category, RiskLevel, TemplateType } from '../lib/analyzer';
import { CATEGORY_COLORS } from './Dashboard';

interface ReportTemplateProps {
  stats: DashboardStats;
  templateSummaries: TemplateSummary[];
  allVariables: TemplateVariable[];
  date: string;
}

// A4 Page: 595px × 842px (8.27" × 11.69")
const A4_STYLES = {
  container: "w-[595px] h-[842px] mx-auto bg-white break-after-page",
  padding: "p-8",
  header: "text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-600",
  smallText: "text-xs",
  tableHeader: "text-xs font-bold bg-gray-200 px-2 py-1",
  tableCell: "text-xs px-2 py-1 border-b border-gray-200"
};

export const ReportTemplate = React.forwardRef<HTMLDivElement, ReportTemplateProps>(
  ({ stats, templateSummaries, allVariables, date }, ref) => {
    const sensitiveVariables = allVariables.filter(v => v.categories.length > 0);

    const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; label: string }> = {
      HIGH: { color: 'text-red-700', bg: 'bg-red-50', label: 'HIGH' },
      MEDIUM: { color: 'text-amber-700', bg: 'bg-amber-50', label: 'MEDIUM' },
      LOW: { color: 'text-blue-700', bg: 'bg-blue-50', label: 'LOW' },
      SAFE: { color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'SAFE' }
    };

    const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
      BASE_TEMPLATE: 'Base',
      BLOCK: 'Block',
      SNIPPET: 'Snippet',
      TEMPLATE: 'Template'
    };

    return (
      <div ref={ref} className="font-sans bg-gray-50">
        {/* PAGE 1: Title Page */}
        <div className={`${A4_STYLES.container} flex flex-col justify-center items-center bg-indigo-600 text-white`}>
          <ShieldCheck className="w-16 h-16 mb-6" />
          <h1 className="text-3xl font-bold text-center mb-4">Template Variable Analysis Report</h1>
          <p className="text-center mb-2 text-sm">Security & Compliance Assessment</p>
          <p className="text-center text-xs opacity-75 flex items-center gap-2">
            <Calendar className="w-3 h-3" /> {date}
          </p>
          <div className="mt-12 pt-12 border-t border-white border-opacity-20 text-center">
            <p className="text-xs opacity-75">Total Templates: {stats.totalTemplates}</p>
            <p className="text-xs opacity-75">Sensitive Variables: {stats.sensitiveVariablesCount}</p>
          </div>
        </div>

        {/* PAGE 2: Executive Summary */}
        <div className={`${A4_STYLES.container} ${A4_STYLES.padding} flex flex-col`}>
          <h2 className={A4_STYLES.header}>Executive Summary</h2>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs font-bold text-gray-600">Total Templates</p>
              <p className="text-lg font-bold text-gray-900">{stats.totalTemplates}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs font-bold text-gray-600">Sensitive Variables</p>
              <p className="text-lg font-bold text-red-600">{stats.sensitiveVariablesCount}</p>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <p className="text-xs font-bold text-red-600">High Risk</p>
              <p className="text-lg font-bold text-red-700">{stats.highRiskCount}</p>
            </div>
            <div className="bg-emerald-50 p-2 rounded">
              <p className="text-xs font-bold text-emerald-600">Safe</p>
              <p className="text-lg font-bold text-emerald-700">{stats.totalTemplates - stats.highRiskCount}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className={`${A4_STYLES.header} mb-2`}>Risk Distribution</p>
            <div className="space-y-1">
              {Object.entries(stats.riskDistribution).map(([level, count]) => (
                <div key={level} className="flex justify-between text-xs">
                  <span className="font-medium">{RISK_CONFIG[level as RiskLevel].label}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className={`${A4_STYLES.header} mb-2`}>Template Types</p>
            <div className="space-y-1">
              {Object.entries(stats.templateTypeDistribution).map(([type, count]) => (
                <div key={type} className="flex justify-between text-xs">
                  <span className="font-medium">{TEMPLATE_TYPE_LABELS[type as TemplateType]}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PAGE 3-N: All Templates - Detail Listing */}
        {templateSummaries
          .sort((a, b) => {
            const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2, SAFE: 3 };
            return riskOrder[a.riskLevel as RiskLevel] - riskOrder[b.riskLevel as RiskLevel];
          })
          .reduce((pages: TemplateSummary[][], template, idx) => {
            if (idx % 12 === 0) pages.push([]);
            pages[pages.length - 1].push(template);
            return pages;
          }, [])
          .map((pageTemplates, pageIdx) => (
            <div key={`templates-page-${pageIdx}`} className={`${A4_STYLES.container} ${A4_STYLES.padding} overflow-hidden`}>
              <h2 className={A4_STYLES.header}>All Templates - Part {pageIdx + 1}</h2>
              
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className={`${A4_STYLES.tableHeader} text-left`}>Template</th>
                    <th className={`${A4_STYLES.tableHeader} text-center`}>Type</th>
                    <th className={`${A4_STYLES.tableHeader} text-center`}>Risk</th>
                    <th className={`${A4_STYLES.tableHeader} text-center`}>Sens</th>
                  </tr>
                </thead>
                <tbody>
                  {pageTemplates.map((template, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className={`${A4_STYLES.tableCell} text-left font-medium`}>
                        {template.templateName.substring(0, 30)}
                      </td>
                      <td className={`${A4_STYLES.tableCell} text-center`}>
                        {TEMPLATE_TYPE_LABELS[template.templateType]}
                      </td>
                      <td className={`${A4_STYLES.tableCell} text-center`}>
                        <span className={`px-1 py-0.5 rounded ${RISK_CONFIG[template.riskLevel].bg} ${RISK_CONFIG[template.riskLevel].color} font-bold`}>
                          {RISK_CONFIG[template.riskLevel].label}
                        </span>
                      </td>
                      <td className={`${A4_STYLES.tableCell} text-center font-bold text-red-600`}>
                        {template.sensitiveCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* Sensitive Variables - Detail Listing (Multiple Pages) */}
        {sensitiveVariables
          .reduce((pages: TemplateVariable[][], variable, idx) => {
            if (idx % 20 === 0) pages.push([]);
            pages[pages.length - 1].push(variable);
            return pages;
          }, [])
          .map((pageVariables, pageIdx) => (
            <div key={`variables-page-${pageIdx}`} className={`${A4_STYLES.container} ${A4_STYLES.padding} overflow-hidden`}>
              <h2 className={A4_STYLES.header}>Sensitive Variables - Part {pageIdx + 1} of {Math.ceil(sensitiveVariables.length / 20)}</h2>
              
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className={`${A4_STYLES.tableHeader} text-left`}>Variable</th>
                    <th className={`${A4_STYLES.tableHeader} text-left`}>Template</th>
                    <th className={`${A4_STYLES.tableHeader} text-left`}>Category</th>
                    <th className={`${A4_STYLES.tableHeader} text-center`}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {pageVariables.map((variable, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className={`${A4_STYLES.tableCell} text-left font-mono font-bold text-indigo-600`}>
                        {variable.variableName.substring(0, 20)}
                      </td>
                      <td className={`${A4_STYLES.tableCell} text-left`}>
                        {variable.template.substring(0, 20)}
                      </td>
                      <td className={`${A4_STYLES.tableCell} text-left`}>
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: CATEGORY_COLORS[variable.categories[0] as Category] }}
                          />
                          <span>{variable.categories[0]}</span>
                        </div>
                      </td>
                      <td className={`${A4_STYLES.tableCell} text-center font-bold`}>
                        {variable.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* Category Breakdown - Detail Listing */}
        <div className={`${A4_STYLES.container} ${A4_STYLES.padding}`}>
          <h2 className={A4_STYLES.header}>Category Breakdown</h2>
          
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className={`${A4_STYLES.tableHeader} text-left`}>Category</th>
                <th className={`${A4_STYLES.tableHeader} text-center`}>Count</th>
                <th className={`${A4_STYLES.tableHeader} text-center`}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.categoryDistribution)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([cat, count], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className={`${A4_STYLES.tableCell} text-left flex items-center gap-2`}>
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: CATEGORY_COLORS[cat as Category] }}
                      />
                      <span className="font-medium">{cat}</span>
                    </td>
                    <td className={`${A4_STYLES.tableCell} text-center font-bold`}>
                      {count as number}
                    </td>
                    <td className={`${A4_STYLES.tableCell} text-center`}>
                      {((((count as number) / stats.sensitiveVariablesCount) * 100).toFixed(1))}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Recommendations Page */}
        <div className={`${A4_STYLES.container} ${A4_STYLES.padding} flex flex-col`}>
          <h2 className={A4_STYLES.header}>Recommendations</h2>
          
          <div className="space-y-2 text-xs">
            <div className="border-l-4 border-red-500 bg-red-50 p-2 rounded-r">
              <p className="font-bold text-red-900">High Priority: {stats.highRiskCount} High-Risk Templates</p>
              <p className="text-red-700 text-xs">Require immediate remediation and enhanced security controls</p>
            </div>

            <div className="border-l-4 border-amber-500 bg-amber-50 p-2 rounded-r">
              <p className="font-bold text-amber-900">Medium Priority: Medium-Risk Templates</p>
              <p className="text-amber-700 text-xs">Review PII handling and implement additional safeguards</p>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 p-2 rounded-r">
              <p className="font-bold text-blue-900">Monitoring: Low-Risk Templates</p>
              <p className="text-blue-700 text-xs">Continue regular compliance audits and maintain security standards</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="text-xs font-bold mb-2">Implementation Checklist:</p>
            <ul className="space-y-1 text-xs">
              <li>• Implement role-based access control (RBAC)</li>
              <li>• Establish data retention and disposal policies</li>
              <li>• Conduct quarterly security reviews</li>
              <li>• Train staff on data sensitivity</li>
              <li>• Maintain comprehensive audit logs</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
);

ReportTemplate.displayName = 'ReportTemplate';
