/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertCircle, AlertTriangle, CheckCircle,
  ChevronRight
} from 'lucide-react';
import {
  TemplateSummary, TemplateVariable, VariableType, RiskLevel
} from '../lib/analyzer';
import { CATEGORY_COLORS, CATEGORY_ICONS, TYPE_COLORS } from './Dashboard';

const RISK_CONFIG: Record<RiskLevel, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  HIGH: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    label: 'High Risk'
  },
  MEDIUM: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    label: 'Medium Risk'
  },
  LOW: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-slate-700 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    border: 'border-slate-200 dark:border-slate-800',
    label: 'Low Risk'
  },
  SAFE: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    label: 'Safe'
  }
};

interface TemplateListProps {
  risks: TemplateSummary[];
  onSelectTemplate: (template: TemplateSummary | null) => void;
  selectedTemplate: TemplateSummary | null;
  searchQuery?: string;
}

function highlightText(text: string, searchTerm: string | undefined) {
  if (!searchTerm || !text) return text;

  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === searchTerm.toLowerCase()
      ? <span key={index} className="bg-yellow-200 dark:bg-yellow-500/30 text-gray-900 dark:text-yellow-200 px-0.5 rounded font-bold">{part}</span>
      : part
  );
}

export function TemplateList({ risks, onSelectTemplate, selectedTemplate, searchQuery }: TemplateListProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-50 dark:border-gray-700">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Template Risk Summary</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{risks.length} templates analyzed. Select a template to inspect sensitive variables, category exposure, and risk drivers.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" /> High
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" /> Medium
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-slate-500" /> Low
            </span>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
        {risks.map((risk) => {
          const config = RISK_CONFIG[risk.riskLevel];
          const isSelected = selectedTemplate?.templateName === risk.templateName;

          return (
            <button
              key={risk.templateName}
              onClick={() => onSelectTemplate(isSelected ? null : risk)}
              className={`
                w-full p-6 text-left transition-all duration-200 flex items-center justify-between
              ${isSelected ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${config.bg} ${config.color} border ${config.border}`}>
                  {config.icon}
                </div>
                <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {highlightText(risk.templateName, searchQuery)}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300`}>
                      {risk.templateType === 'BASE_TEMPLATE' ? 'Base Template (Master)' :
                        risk.templateType === 'BLOCK' ? 'Block' :
                          risk.templateType === 'SNIPPET' ? 'Snippet' :
                            risk.templateType === 'TEMPLATE' ? 'Template' : 'Others'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {risk.sensitiveCount} / {risk.totalCount} sensitive
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {Array.from(risk.categories).map((cat, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center"
                      style={{ color: CATEGORY_COLORS[cat] }}
                      title={cat}
                    >
                      {CATEGORY_ICONS[cat]}
                    </div>
                  ))}
                  {risk.categories.size > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-300">
                      +{risk.categories.size - 3}
                    </div>
                  )}
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-300 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface VariableTableProps {
  variables: TemplateVariable[];
  searchQuery?: string;
}

export function VariableTable({ variables, searchQuery }: VariableTableProps) {
  if (variables.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-12 text-center">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No variables match the current view. Try toggling the sensitive filter or selecting a different template.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-wider font-bold">
            <tr>
              <th className="px-6 py-4">Variable</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Categories</th>
              <th className="px-6 py-4">Flow / Section</th>
              <th className="px-6 py-4">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {variables.map((v, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-mono text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded inline-block" title={v.objectPath}>
                    {highlightText(v.variableName, searchQuery)}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {highlightText(v.objectPath, searchQuery)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${TYPE_COLORS[v.type]}20`, color: TYPE_COLORS[v.type] }}
                  >
                    {v.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 flex-wrap">
                    {v.categories.length > 0 ? v.categories.map((cat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
                        style={{ backgroundColor: `${CATEGORY_COLORS[cat]}15`, color: CATEGORY_COLORS[cat] }}
                      >
                        {CATEGORY_ICONS[cat]}
                        {cat}
                      </div>
                    )) : (
                      <span className="text-gray-300 dark:text-gray-600">None</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{v.flow}</td>
                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{v.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
