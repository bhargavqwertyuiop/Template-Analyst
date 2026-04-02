/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'EMAIL' | 'PII' | 'FINANCIAL' | 'SECURITY' | 'CONTACT' | 'NONE';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';

export interface RawTemplateData {
  WfdName: string;
  'Module Name': string;
  'Object Name': string;
  'Object Type': string;
  'First Used in': string;
  'Found Count': number | string;
}

export interface SensitiveVariable {
  template: string;
  module: string;
  variable: string;
  category: Category;
  flow: string;
  count: number;
}

export interface TemplateRisk {
  templateName: string;
  variables: SensitiveVariable[];
  totalCount: number;
  categories: Set<Category>;
  riskLevel: RiskLevel;
}

export interface DashboardStats {
  totalTemplates: number;
  sensitiveTemplates: number;
  totalSensitiveVariables: number;
  highRiskCount: number;
  categoryDistribution: Record<Category, number>;
}

export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  EMAIL: ['email', 'emailto', 'emailfrom', 'emailsubject'],
  PII: ['name', 'fullname', 'surname', 'ssn', 'socialsecurity', 'dob'],
  FINANCIAL: ['account', 'iban', 'swift', 'ifsc', 'neft', 'routing', 'card'],
  SECURITY: ['password', 'pin', 'otp', 'atm', 'cvv'],
  CONTACT: ['phone', 'mobile', 'address'],
  NONE: []
};

export function extractVariableName(objectName: string): string {
  // From: Data.II_LocalVariables_xxx.Calculated.EmailTo -> EmailTo
  const parts = objectName.split('.');
  return parts[parts.length - 1] || '';
}

export function detectCategory(variableName: string): Category {
  const normalized = variableName.toLowerCase().trim();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'NONE') continue;
    if (keywords.some(keyword => normalized.includes(keyword))) {
      return category as Category;
    }
  }
  
  return 'NONE';
}

export function calculateRiskLevel(categories: Set<Category>): RiskLevel {
  if (categories.has('FINANCIAL') && categories.has('SECURITY')) return 'HIGH';
  if (categories.has('PII') || categories.has('FINANCIAL') || categories.has('SECURITY')) return 'MEDIUM';
  if (categories.has('EMAIL') || categories.has('CONTACT')) return 'LOW';
  return 'SAFE';
}

export function processRawData(data: RawTemplateData[]): {
  sensitiveVariables: SensitiveVariable[];
  templateRisks: TemplateRisk[];
  stats: DashboardStats;
} {
  const sensitiveVariables: SensitiveVariable[] = [];
  const templateMap: Record<string, SensitiveVariable[]> = {};

  data.forEach(row => {
    const varName = extractVariableName(row['Object Name']);
    const category = detectCategory(varName);

    if (category !== 'NONE') {
      const sensitiveVar: SensitiveVariable = {
        template: row.WfdName.split('/').pop() || row.WfdName,
        module: row['Module Name'],
        variable: varName,
        category,
        flow: row['First Used in'],
        count: Number(row['Found Count']) || 0
      };

      sensitiveVariables.push(sensitiveVar);

      if (!templateMap[sensitiveVar.template]) {
        templateMap[sensitiveVar.template] = [];
      }
      templateMap[sensitiveVar.template].push(sensitiveVar);
    }
  });

  const templateRisks: TemplateRisk[] = Object.entries(templateMap).map(([name, vars]) => {
    const categories = new Set(vars.map(v => v.category));
    return {
      templateName: name,
      variables: vars,
      totalCount: vars.reduce((sum, v) => sum + v.count, 0),
      categories,
      riskLevel: calculateRiskLevel(categories)
    };
  });

  const stats: DashboardStats = {
    totalTemplates: new Set(data.map(d => d.WfdName)).size,
    sensitiveTemplates: templateRisks.length,
    totalSensitiveVariables: sensitiveVariables.length,
    highRiskCount: templateRisks.filter(r => r.riskLevel === 'HIGH').length,
    categoryDistribution: sensitiveVariables.reduce((acc, v) => {
      acc[v.category] = (acc[v.category] || 0) + 1;
      return acc;
    }, {} as Record<Category, number>)
  };

  return { sensitiveVariables, templateRisks, stats };
}
