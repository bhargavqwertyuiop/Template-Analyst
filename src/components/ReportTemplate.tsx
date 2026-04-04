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

const A4_WIDTH = 595;
const A4_HEIGHT = 842;

interface ReportTemplateProps {
  stats: DashboardStats | null;
  templateSummaries: TemplateSummary[];
  allVariables: TemplateVariable[];
  date: string;
}

export const ReportTemplate = React.forwardRef<HTMLDivElement, ReportTemplateProps>(
  ({ stats, templateSummaries, allVariables, date }, ref) => {
    // Validate inputs
    if (!stats || typeof stats !== 'object') {
      console.warn('ReportTemplate: Invalid stats provided');
      return <div style={{ width: '595px', height: '842px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No report data available</div>;
    }
    if (!Array.isArray(templateSummaries)) {
      console.warn('ReportTemplate: Invalid templateSummaries');
      return null;
    }
    if (!Array.isArray(allVariables)) {
      console.warn('ReportTemplate: Invalid allVariables');
      return null;
    }
    const sensitiveVariables = allVariables.filter(v => v.categories.length > 0);

    const RISK_CONFIG: Record<RiskLevel, { color: string; label: string }> = {
      HIGH: { color: '#dc2626', label: 'HIGH' },
      MEDIUM: { color: '#f59e0b', label: 'MEDIUM' },
      LOW: { color: '#3b82f6', label: 'LOW' },
      SAFE: { color: '#10b981', label: 'SAFE' }
    };

    const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
      BASE_TEMPLATE: 'Base',
      BLOCK: 'Block',
      SNIPPET: 'Snippet',
      TEMPLATE: 'Template'
    };

    const pageStyle: React.CSSProperties = {
      width: `${A4_WIDTH}px`,
      height: `${A4_HEIGHT}px`,
      margin: '0 auto',
      padding: '32px',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#111827',
      pageBreakAfter: 'always'
    };

    const headerStyle: React.CSSProperties = {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: '2px solid #4f46e5'
    };

    const tableStyle: React.CSSProperties = {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '11px',
      marginTop: '12px'
    };

    const headerCellStyle: React.CSSProperties = {
      backgroundColor: '#d1d5db',
      padding: '4px 8px',
      border: '1px solid #d1d5db',
      fontWeight: 'bold',
      textAlign: 'left'
    };

    const cellStyle: React.CSSProperties = {
      padding: '4px 8px',
      border: '1px solid #e5e7eb'
    };

    return (
      <div ref={ref} style={{ backgroundColor: '#f3f4f6' }}>
        {/* PAGE 1: Title Page */}
        <div data-report-page style={{
            ...pageStyle,
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <ShieldCheck size={64} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' }}>
            Template Variable Analysis Report
          </h1>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>Security & Compliance Assessment</p>
          <p style={{ fontSize: '12px', opacity: 0.8 }}>Generated on {date}</p>
          <div style={{ marginTop: '48px', paddingTop: '48px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <p style={{ fontSize: '11px', opacity: 0.8 }}>Total Templates: {stats.totalTemplates}</p>
            <p style={{ fontSize: '11px', opacity: 0.8 }}>Sensitive Variables: {stats.sensitiveVariablesCount}</p>
          </div>
        </div>

        {/* PAGE 2: Executive Summary */}
        <div data-report-page style={pageStyle}>
          <h2 style={headerStyle}>Executive Summary</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#f3f4f6', padding: '8px', borderRadius: '4px' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280' }}>TOTAL TEMPLATES</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>{stats.totalTemplates}</p>
            </div>
            <div style={{ backgroundColor: '#f3f4f6', padding: '8px', borderRadius: '4px' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280' }}>SENSITIVE VARIABLES</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>{stats.sensitiveVariablesCount}</p>
            </div>
            <div style={{ backgroundColor: '#fee2e2', padding: '8px', borderRadius: '4px' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#991b1b' }}>HIGH RISK</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#7f1d1d' }}>{stats.highRiskCount}</p>
            </div>
            <div style={{ backgroundColor: '#dcfce7', padding: '8px', borderRadius: '4px' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#166534' }}>SAFE</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#15803d' }}>{stats.totalTemplates - stats.highRiskCount}</p>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Risk Distribution</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
              {Object.entries(stats.riskDistribution).map(([level, count]) => (
                <div key={level} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>{RISK_CONFIG[level as RiskLevel].label}</span>
                  <span style={{ fontWeight: 'bold' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Template Types</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
              {Object.entries(stats.templateTypeDistribution).map(([type, count]) => (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>{TEMPLATE_TYPE_LABELS[type as TemplateType]}</span>
                  <span style={{ fontWeight: 'bold' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PAGES 3+: All Templates - Paginated */}
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
            <div key={`templates-${pageIdx}`} data-report-page style={pageStyle}>
              <h2 style={headerStyle}>All Templates - Part {pageIdx + 1}</h2>

              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...headerCellStyle, textAlign: 'left', width: '50%' }}>Template Name</th>
                    <th style={{ ...headerCellStyle, textAlign: 'center', width: '15%' }}>Type</th>
                    <th style={{ ...headerCellStyle, textAlign: 'center', width: '15%' }}>Risk</th>
                    <th style={{ ...headerCellStyle, textAlign: 'center', width: '20%' }}>Sensitive</th>
                  </tr>
                </thead>
                <tbody>
                  {pageTemplates.map((template, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ ...cellStyle, textAlign: 'left' }}>{template.templateName.substring(0, 35)}</td>
                      <td style={{ ...cellStyle, textAlign: 'center', fontSize: '10px' }}>
                        {TEMPLATE_TYPE_LABELS[template.templateType]}
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: 'center',
                          fontWeight: 'bold',
                          color: RISK_CONFIG[template.riskLevel].color
                        }}
                      >
                        {RISK_CONFIG[template.riskLevel].label}
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold', color: '#dc2626' }}>
                        {template.sensitiveCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* PAGES: Sensitive Variables - Paginated */}
        {sensitiveVariables
          .reduce((pages: TemplateVariable[][], variable, idx) => {
            if (idx % 18 === 0) pages.push([]);
            pages[pages.length - 1].push(variable);
            return pages;
          }, [])
          .map((pageVariables, pageIdx) => (
            <div key={`variables-${pageIdx}`} data-report-page style={pageStyle}>
              <h2 style={headerStyle}>
                Sensitive Variables - Part {pageIdx + 1} of {Math.ceil(sensitiveVariables.length / 18)}
              </h2>

              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...headerCellStyle, textAlign: 'left', width: '25%' }}>Variable</th>
                    <th style={{ ...headerCellStyle, textAlign: 'left', width: '30%' }}>Template</th>
                    <th style={{ ...headerCellStyle, textAlign: 'left', width: '25%' }}>Category</th>
                    <th style={{ ...headerCellStyle, textAlign: 'center', width: '20%' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {pageVariables.map((variable, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ ...cellStyle, fontFamily: 'monospace', color: '#4f46e5', fontWeight: 'bold' }}>
                        {variable.variableName.substring(0, 18)}
                      </td>
                      <td style={{ ...cellStyle }}>{variable.template.substring(0, 25)}</td>
                      <td style={{ ...cellStyle }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: CATEGORY_COLORS[variable.categories[0] as Category]
                            }}
                          />
                          <span>{variable.categories[0]}</span>
                        </div>
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold' }}>
                        {variable.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* PAGE: Category Breakdown */}
        <div data-report-page style={pageStyle}>
          <h2 style={headerStyle}>Category Breakdown</h2>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...headerCellStyle, textAlign: 'left', width: '50%' }}>Category</th>
                <th style={{ ...headerCellStyle, textAlign: 'center', width: '25%' }}>Count</th>
                <th style={{ ...headerCellStyle, textAlign: 'center', width: '25%' }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.categoryDistribution)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([cat, count], i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ ...cellStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: CATEGORY_COLORS[cat as Category]
                        }}
                      />
                      <span style={{ fontWeight: 'bold' }}>{cat}</span>
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold' }}>
                      {count as number}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>
                      {((((count as number) / stats.sensitiveVariablesCount) * 100).toFixed(1))}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* PAGE: Recommendations */}
        <div data-report-page style={pageStyle}>
          <h2 style={headerStyle}>Recommendations</h2>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ borderLeft: '4px solid #dc2626', backgroundColor: '#fee2e2', padding: '8px', marginBottom: '8px' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#7f1d1d', marginBottom: '4px' }}>
                High Priority: {stats.highRiskCount} High-Risk Templates
              </p>
              <p style={{ fontSize: '11px', color: '#991b1b' }}>
                Require immediate remediation and enhanced security controls.
              </p>
            </div>

            <div style={{ borderLeft: '4px solid #f59e0b', backgroundColor: '#fef3c7', padding: '8px', marginBottom: '8px' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>
                Medium Priority: Medium-Risk Templates
              </p>
              <p style={{ fontSize: '11px', color: '#b45309' }}>Review PII handling and implement additional safeguards.</p>
            </div>

            <div style={{ borderLeft: '4px solid #3b82f6', backgroundColor: '#dbeafe', padding: '8px' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>
                Monitoring: Low-Risk Templates
              </p>
              <p style={{ fontSize: '11px', color: '#1e3a8a' }}>Continue regular compliance audits and maintain security standards.</p>
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' }}>Implementation Checklist:</p>
            <ul style={{ fontSize: '10px', lineHeight: '1.6', color: '#374151', marginLeft: '16px' }}>
              <li>✓ Implement role-based access control (RBAC)</li>
              <li>✓ Establish data retention and disposal policies</li>
              <li>✓ Conduct quarterly security reviews</li>
              <li>✓ Train staff on data sensitivity</li>
              <li>✓ Maintain comprehensive audit logs</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
);

ReportTemplate.displayName = 'ReportTemplate';
