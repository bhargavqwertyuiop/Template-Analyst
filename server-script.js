const fs = require('fs');
const path = require('path');

const SENSITIVE_DICTIONARY = {
  EMAIL: ["email", "emailid", "email_to", "emailfrom", "emailsubject"],
  PII: ["name", "fullname", "surname", "dob", "ssn", "socialsecurity"],
  FINANCIAL: ["account", "iban", "swift", "card", "cvv", "ifsc", "neft", "routing"],
  SECURITY: ["password", "pin", "otp", "token", "atm"],
  CONTACT: ["phone", "mobile", "address"]
};

function extractVariableName(objectName) {
  const parts = objectName.split('.');
  return parts[parts.length - 1] || '';
}

function detectCategories(variableName) {
  const normalized = variableName.toLowerCase().trim();
  const matches = [];
  
  for (const [category, keywords] of Object.entries(SENSITIVE_DICTIONARY)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      matches.push(category);
    }
  }
  
  return matches;
}

function classifyVariableType(objectPath, categories) {
  const path = objectPath.toLowerCase();
  if (path.startsWith('system.') || path.includes('.internal.')) return 'System';
  if (path.startsWith('global.') || path.includes('.globals.')) return 'Global';
  if (categories.length > 0) return 'Sensitive';
  return 'Other';
}

function calculateRiskLevel(categories) {
  const catSet = new Set(categories);
  if (catSet.has('SECURITY') && catSet.has('FINANCIAL')) return 'HIGH';
  if (catSet.has('PII') || catSet.has('FINANCIAL') || catSet.has('SECURITY')) return 'MEDIUM';
  if (catSet.has('EMAIL') || catSet.has('CONTACT')) return 'LOW';
  return 'SAFE';
}

function processTemplateFile(inputPath) {
  console.log(`Processing: ${inputPath}`);
  const content = fs.readFileSync(inputPath, 'utf8');
  const lines = content.split('\n');
  const headers = lines[0].split(';').map(h => h.trim());

  const allVariables = [];
  const templateMap = {};

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(';').map(v => v.trim());
    const row = {};
    headers.forEach((h, idx) => row[h] = values[idx]);

    const objectPath = row['Object Name'] || '';
    const varName = extractVariableName(objectPath);
    const categories = detectCategories(varName);
    const type = classifyVariableType(objectPath, categories);

    const variable = {
      template: row.WfdName.split('/').pop() || row.WfdName,
      variable: varName,
      objectPath: objectPath,
      module: row['Module Name'],
      type,
      category: categories.length > 0 ? categories[0] : 'NONE', // For backward compatibility in some outputs
      categories,
      flow: row['First Used in'],
      count: parseInt(row['Found Count']) || 0
    };

    allVariables.push(variable);

    if (!templateMap[variable.template]) {
      templateMap[variable.template] = [];
    }
    templateMap[variable.template].push(variable);
  }

  // Generate Categorized JSONs
  const systemVars = allVariables.filter(v => v.type === 'System');
  const globalVars = allVariables.filter(v => v.type === 'Global');
  const sensitiveVars = allVariables.filter(v => v.type === 'Sensitive');
  const otherVars = allVariables.filter(v => v.type === 'Other');

  fs.writeFileSync('system_variables.json', JSON.stringify(systemVars, null, 2));
  fs.writeFileSync('global_variables.json', JSON.stringify(globalVars, null, 2));
  fs.writeFileSync('sensitive_variables.json', JSON.stringify(sensitiveVars, null, 2));
  fs.writeFileSync('other_variables.json', JSON.stringify(otherVars, null, 2));

  // Generate Template Summaries
  const summaries = Object.entries(templateMap).map(([name, vars]) => {
    const sensitive = vars.filter(v => v.type === 'Sensitive');
    const categories = new Set(sensitive.flatMap(v => v.categories));
    return {
      templateName: name,
      totalVariables: vars.length,
      sensitiveCount: sensitive.length,
      categories: Array.from(categories),
      riskLevel: calculateRiskLevel(Array.from(categories))
    };
  });

  fs.writeFileSync('template_summaries.json', JSON.stringify(summaries, null, 2));

  console.log('Processing complete. JSON files generated.');
}

// Example usage: node server-script.js input.txt
const args = process.argv.slice(2);
if (args.length > 0) {
  processTemplateFile(args[0]);
} else {
  console.log('Please provide an input file path.');
}
