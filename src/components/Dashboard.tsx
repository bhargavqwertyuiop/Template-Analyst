/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Layout, ShieldAlert, Database, AlertTriangle, 
  Mail, User, CreditCard, Lock, Phone 
} from 'lucide-react';
import { DashboardStats, Category, TemplateSummary, RiskLevel, VariableType, TemplateType } from '../lib/analyzer';

const CATEGORY_COLORS: Record<Category, string> = {
  EMAIL: '#3b82f6', // blue-500
  PII: '#8b5cf6', // violet-500
  FINANCIAL: '#f59e0b', // amber-500
  SECURITY: '#ef4444', // red-500
  CONTACT: '#10b981', // emerald-500
  NONE: '#94a3b8' // slate-400
};

const RISK_COLORS: Record<RiskLevel, string> = {
  HIGH: '#ef4444', // red-500
  MEDIUM: '#f59e0b', // amber-500
  LOW: '#3b82f6', // blue-500
  SAFE: '#10b981' // emerald-500
};

const TEMPLATE_TYPE_COLORS: Record<TemplateType, string> = {
  BASE_TEMPLATE: '#a78bfa', // violet-400
  BLOCK: '#60a5fa', // blue-400
  SNIPPET: '#34d399', // emerald-400
  TEMPLATE: '#fbbf24' // amber-400
};

const TYPE_COLORS: Record<VariableType, string> = {
  System: '#64748b', // slate-500
  Global: '#0ea5e9', // sky-500
  Sensitive: '#ef4444', // red-500
  Other: '#94a3b8' // slate-400
};

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  EMAIL: <Mail className="w-4 h-4" />,
  PII: <User className="w-4 h-4" />,
  FINANCIAL: <CreditCard className="w-4 h-4" />,
  SECURITY: <Lock className="w-4 h-4" />,
  CONTACT: <Phone className="w-4 h-4" />,
  NONE: null
};

interface SummaryCardsProps {
  stats: DashboardStats;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Total Templates',
      value: stats.totalTemplates,
      icon: <Layout className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      label: 'Total Variables',
      value: stats.totalVariables,
      icon: <Database className="w-6 h-6 text-indigo-600" />,
      bg: 'bg-indigo-50',
      border: 'border-indigo-100'
    },
    {
      label: 'Sensitive Variables Count',
      value: stats.sensitiveVariablesCount,
      icon: <ShieldAlert className="w-6 h-6 text-amber-600" />,
      bg: 'bg-amber-50',
      border: 'border-amber-100'
    },
    {
      label: 'High Risk Templates',
      value: stats.highRiskCount,
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      bg: 'bg-red-50',
      border: 'border-red-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, i) => (
        <div key={i} className={`p-6 rounded-2xl border ${card.bg} ${card.border} shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              {card.icon}
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
          <p className="text-3xl font-bold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

interface ChartsProps {
  stats: DashboardStats;
  templateSummaries: TemplateSummary[];
}

export function Charts({ stats, templateSummaries }: ChartsProps) {
  const pieData = Object.entries(stats.categoryDistribution)
    .filter(([name, value]) => name !== 'NONE' && value > 0)
    .map(([name, value]) => ({
      name,
      value
    }));

  const riskData = Object.entries(stats.riskDistribution).map(([name, value]) => ({
    name,
    value
  }));

  const templateTypeData = Object.entries(stats.templateTypeDistribution)
    .filter(([name, value]) => value > 0)
    .map(([name, value]) => ({
      name: name === 'BASE_TEMPLATE' ? 'Base Template (Master)' :
            name === 'BLOCK' ? 'Block' :
            name === 'SNIPPET' ? 'Snippet' : 'Template',
      value,
      type: name
    }));

  const barData = templateSummaries
    .sort((a, b) => b.sensitiveCount - a.sensitiveCount)
    .slice(0, 50)
    .map(t => ({
      name: t.templateName.length > 20 ? t.templateName.substring(0, 17) + '...' : t.templateName,
      fullName: t.templateName,
      sensitive: t.sensitiveCount,
      total: t.totalCount
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-8">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Level Distribution</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name as RiskLevel]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Type Distribution</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={templateTypeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {templateTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={TEMPLATE_TYPE_COLORS[entry.type as TemplateType]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Risky Templates</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748b' }}
                width={100}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [value, 'Sensitive Variables']}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
              />
              <Bar dataKey="sensitive" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={15} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export { CATEGORY_COLORS, CATEGORY_ICONS, TYPE_COLORS };
