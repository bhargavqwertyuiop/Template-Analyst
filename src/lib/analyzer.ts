/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'EMAIL' | 'PII' | 'FINANCIAL' | 'SECURITY' | 'CONTACT' | 'NONE';
export type VariableType = 'System' | 'Global' | 'Sensitive' | 'Other';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';
export type TemplateType = 'BASE_TEMPLATE' | 'BLOCK' | 'SNIPPET' | 'TEMPLATE';

export interface RawTemplateData {
  WfdName: string;
  'Module Name': string;
  'Object Name': string;
  'Object Type': string;
  'First Used in': string;
  'Found Count': number | string;
}

export interface TemplateVariable {
  template: string;
  module: string;
  objectPath: string;
  variableName: string;
  type: VariableType;
  categories: Category[];
  flow: string;
  count: number;
}

export interface TemplateSummary {
  templateName: string;
  variables: TemplateVariable[];
  sensitiveCount: number;
  totalCount: number;
  categories: Set<Category>;
  riskLevel: RiskLevel;
  typeDistribution: Record<VariableType, number>;
  templateType: TemplateType;
  templatePath: string;
}

export interface DashboardStats {
  totalTemplates: number;
  totalVariables: number;
  sensitiveVariablesCount: number;
  highRiskCount: number;
  categoryDistribution: Record<Category, number>;
  typeDistribution: Record<VariableType, number>;
  riskDistribution: Record<RiskLevel, number>;
  templateTypeDistribution: Record<TemplateType, number>;
}

export const SENSITIVE_DICTIONARY: Record<Category, string[]> = {
  EMAIL: ["email", "emailid", "email_to", "emailfrom", "emailsubject"],
  PII: ["name", "fullname", "surname", "dob", "ssn", "socialsecurity"],
  FINANCIAL: ["account", "iban", "swift", "card", "cvv", "ifsc", "neft", "routing"],
  SECURITY: ["password", "pin", "otp", "token", "atm"],
  CONTACT: ["phone", "mobile", "address"],
  NONE: []
};

export function extractVariableName(objectName: string): string {
  const parts = objectName.split('.');
  return parts[parts.length - 1] || '';
}

export function detectTemplateType(wfdName: string): TemplateType {
  const path = wfdName.toLowerCase();
  
  if (path.includes('/base') || path.includes('/master') || path.includes('/basetemplate')) {
    return 'BASE_TEMPLATE';
  }
  if (path.includes('/block') || path.includes('/blocks')) {
    return 'BLOCK';
  }
  if (path.includes('/snippet') || path.includes('/snippets')) {
    return 'SNIPPET';
  }
  return 'TEMPLATE';
}

export function detectCategories(variableName: string): Category[] {
  const normalized = variableName.toLowerCase().trim();
  const matches: Category[] = [];
  
  for (const [category, keywords] of Object.entries(SENSITIVE_DICTIONARY)) {
    if (category === 'NONE') continue;
    if (keywords.some(keyword => normalized.includes(keyword))) {
      matches.push(category as Category);
    }
  }
  
  return matches;
}

export function classifyVariableType(objectPath: string, categories: Category[]): VariableType {
  const path = objectPath.toLowerCase();
  // Quadient Inspire typical paths:
  // Data.II_LocalVariables... -> usually user defined
  // System... -> System
  // Global... -> Global
  if (path.startsWith('system.') || path.includes('.internal.')) return 'System';
  if (path.startsWith('global.') || path.includes('.globals.')) return 'Global';
  if (categories.length > 0) return 'Sensitive';
  return 'Other';
}

export function calculateRiskLevel(categories: Set<Category>): RiskLevel {
  // HIGH -> contains SECURITY + FINANCIAL
  if (categories.has('SECURITY') || categories.has('FINANCIAL')) return 'HIGH';
  // MEDIUM -> contains PII
  if (categories.has('PII')) return 'MEDIUM';
  // LOW -> only EMAIL / CONTACT
  if (categories.has('EMAIL') || categories.has('CONTACT')) return 'LOW';
  return 'SAFE';
}

export function processRawData(data: RawTemplateData[]): {
  allVariables: TemplateVariable[];
  templateSummaries: TemplateSummary[];
  stats: DashboardStats;
} {
  const allVariables: TemplateVariable[] = [];
  const templateMap: Record<string, TemplateVariable[]> = {};
  const templatePathMap: Record<string, string> = {};

  data.forEach(row => {
    const objectPath = row['Object Name'] || '';
    const varName = extractVariableName(objectPath);
    const categories = detectCategories(varName);
    const type = classifyVariableType(objectPath, categories);
    const templateName = row.WfdName.split('/').pop() || row.WfdName;

    const variable: TemplateVariable = {
      template: templateName,
      module: row['Module Name'],
      objectPath,
      variableName: varName,
      type,
      categories,
      flow: row['First Used in'],
      count: Number(row['Found Count']) || 0
    };

    allVariables.push(variable);

    if (!templateMap[variable.template]) {
      templateMap[variable.template] = [];
      templatePathMap[variable.template] = row.WfdName;
    }
    templateMap[variable.template].push(variable);
  });

  const templateSummaries: TemplateSummary[] = Object.entries(templateMap).map(([name, vars]) => {
    const sensitiveVars = vars.filter(v => v.categories.length > 0);
    const categories = new Set(sensitiveVars.flatMap(v => v.categories));
    
    const typeDistribution = vars.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, { System: 0, Global: 0, Sensitive: 0, Other: 0 } as Record<VariableType, number>);

    return {
      templateName: name,
      variables: vars,
      sensitiveCount: sensitiveVars.length,
      totalCount: vars.length,
      categories,
      riskLevel: calculateRiskLevel(categories),
      typeDistribution,
      templateType: detectTemplateType(templatePathMap[name]),
      templatePath: templatePathMap[name]
    };
  });

  const stats: DashboardStats = {
    totalTemplates: new Set(data.map(d => d.WfdName)).size,
    totalVariables: allVariables.length,
    sensitiveVariablesCount: allVariables.filter(v => v.categories.length > 0).length,
    highRiskCount: templateSummaries.filter(r => r.riskLevel === 'HIGH').length,
    categoryDistribution: allVariables.reduce((acc, v) => {
      v.categories.forEach(cat => {
        acc[cat] = (acc[cat] || 0) + 1;
      });
      return acc;
    }, { EMAIL: 0, PII: 0, FINANCIAL: 0, SECURITY: 0, CONTACT: 0, NONE: 0 } as Record<Category, number>),
    typeDistribution: allVariables.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, { System: 0, Global: 0, Sensitive: 0, Other: 0 } as Record<VariableType, number>),
    riskDistribution: templateSummaries.reduce((acc, summary) => {
      acc[summary.riskLevel] = (acc[summary.riskLevel] || 0) + 1;
      return acc;
    }, { HIGH: 0, MEDIUM: 0, LOW: 0, SAFE: 0 } as Record<RiskLevel, number>),
    templateTypeDistribution: templateSummaries.reduce((acc, summary) => {
      acc[summary.templateType] = (acc[summary.templateType] || 0) + 1;
      return acc;
    }, { BASE_TEMPLATE: 0, BLOCK: 0, SNIPPET: 0, TEMPLATE: 0 } as Record<TemplateType, number>)
  };

  return { allVariables, templateSummaries, stats };
}
