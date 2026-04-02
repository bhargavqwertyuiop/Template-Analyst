/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  AlertCircle, AlertTriangle, CheckCircle, 
  Search, Filter, ChevronRight, MoreVertical 
} from 'lucide-react';
import { 
  TemplateRisk, SensitiveVariable, RiskLevel, Category 
} from '../lib/analyzer';
import { CATEGORY_COLORS, CATEGORY_ICONS } from './Dashboard';

const RISK_CONFIG: Record<RiskLevel, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  HIGH: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'High Risk'
  },
  MEDIUM: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Medium Risk'
  },
  LOW: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Low Risk'
  },
  SAFE: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Safe'
  }
};

interface TemplateListProps {
  risks: TemplateRisk[];
  onSelectTemplate: (template: TemplateRisk | null) => void;
  selectedTemplate: TemplateRisk | null;
}

export function TemplateList({ risks, onSelectTemplate, selectedTemplate }: TemplateListProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Template Risk Analysis</h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" /> High
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" /> Low
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
        {risks.map((risk) => {
          const config = RISK_CONFIG[risk.riskLevel];
          const isSelected = selectedTemplate?.templateName === risk.templateName;

          return (
            <button
              key={risk.templateName}
              onClick={() => onSelectTemplate(isSelected ? null : risk)}
              className={`
                w-full p-6 text-left transition-all duration-200 flex items-center justify-between
                ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${config.bg} ${config.color} border ${config.border}`}>
                  {config.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{risk.templateName}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {risk.variables.length} sensitive variables
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {Array.from(risk.categories).map((cat, i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center"
                      style={{ color: CATEGORY_COLORS[cat] }}
                      title={cat}
                    >
                      {CATEGORY_ICONS[cat]}
                    </div>
                  ))}
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
  variables: SensitiveVariable[];
}

export function VariableTable({ variables }: VariableTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-bold">
            <tr>
              <th className="px-6 py-4">Variable Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Flow / Section</th>
              <th className="px-6 py-4">Count</th>
              <th className="px-6 py-4">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {variables.map((v, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                    {v.variable}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${CATEGORY_COLORS[v.category]}20`, color: CATEGORY_COLORS[v.category] }}
                    >
                      {CATEGORY_ICONS[v.category]}
                    </div>
                    <span className="font-medium text-gray-700">{v.category}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">{v.flow}</td>
                <td className="px-6 py-4 font-semibold text-gray-900">{v.count}</td>
                <td className="px-6 py-4">
                  {v.category === 'SECURITY' || v.category === 'FINANCIAL' ? (
                    <span className="flex items-center gap-1 text-red-600 font-bold text-xs uppercase tracking-tighter">
                      <AlertCircle className="w-3 h-3" /> Critical
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Standard</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
