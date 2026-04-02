/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, CellProps
} from 'recharts';
import { 
  Layout, ShieldAlert, Database, AlertTriangle, 
  Mail, User, CreditCard, Lock, Phone 
} from 'lucide-react';
import { DashboardStats, Category, TemplateRisk } from '../lib/analyzer';

const CATEGORY_COLORS: Record<Category, string> = {
  EMAIL: '#3b82f6', // blue-500
  PII: '#8b5cf6', // violet-500
  FINANCIAL: '#f59e0b', // amber-500
  SECURITY: '#ef4444', // red-500
  CONTACT: '#10b981', // emerald-500
  NONE: '#94a3b8' // slate-400
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
      label: 'Sensitive Templates',
      value: stats.sensitiveTemplates,
      icon: <Database className="w-6 h-6 text-indigo-600" />,
      bg: 'bg-indigo-50',
      border: 'border-indigo-100'
    },
    {
      label: 'Sensitive Variables',
      value: stats.totalSensitiveVariables,
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
  templateRisks: TemplateRisk[];
}

export function Charts({ stats, templateRisks }: ChartsProps) {
  const pieData = Object.entries(stats.categoryDistribution).map(([name, value]) => ({
    name,
    value
  }));

  const barData = templateRisks
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, 10)
    .map(t => ({
      name: t.templateName.length > 20 ? t.templateName.substring(0, 17) + '...' : t.templateName,
      fullName: t.templateName,
      count: t.totalCount
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Distribution</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
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

      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Sensitive Templates</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 40, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                width={120}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [value, 'Variables']}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export { CATEGORY_COLORS, CATEGORY_ICONS };
