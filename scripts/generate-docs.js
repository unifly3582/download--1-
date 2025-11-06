#!/usr/bin/env node

/**
 * Automated Documentation Generator
 * Scans codebase and generates up-to-date documentation
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 Scanning codebase for API usage...');

// Scan for API endpoints
function scanApiEndpoints() {
  const apiFiles = glob.sync('src/app/api/**/*.ts');
  const endpoints = [];
  
  apiFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = file.replace('src/app/api', '/api').replace('/route.ts', '');
    
    // Detect HTTP methods
    const methods = [];
    if (content.includes('export const GET') || content.includes('export async function GET')) methods.push('GET');
    if (content.includes('export const POST') || content.includes('export async function POST')) methods.push('POST');
    if (content.includes('export const PUT') || content.includes('export async function PUT')) methods.push('PUT');
    if (content.includes('export const DELETE') || content.includes('export async function DELETE')) methods.push('DELETE');
    
    // Detect authentication
    const requiresAuth = content.includes('withAuth') || content.includes('AuthContext');
    const authLevel = content.includes("withAuth(['admin'])") ? 'Admin' : 
                     content.includes("withAuth(['machine'])") ? 'Machine' : 
                     requiresAuth ? 'User' : 'None';
    
    // Extract purpose from comments
    const purposeMatch = content.match(/\* (.*?)(?:\n|\*\/)/);
    const purpose = purposeMatch ? purposeMatch[1] : 'No description';
    
    endpoints.push({
      path: relativePath,
      methods,
      auth: authLevel,
      purpose,
      file
    });
  });
  
  return endpoints;
}

// Scan for frontend usage
function scanFrontendUsage() {
  const frontendFiles = glob.sync('src/app/(dashboard)/**/*.tsx');
  const usage = {};
  
  frontendFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Find API calls
    const apiCalls = content.match(/['"`]\/api\/[^'"`]+['"`]/g);
    if (apiCalls) {
      apiCalls.forEach(call => {
        const endpoint = call.replace(/['"`]/g, '');
        if (!usage[endpoint]) usage[endpoint] = [];
        usage[endpoint].push({
          file: file.replace('src/', ''),
          component: path.basename(file, '.tsx')
        });
      });
    }
  });
  
  return usage;
}

// Generate API documentation
function generateApiDocs() {
  const endpoints = scanApiEndpoints();
  const usage = scanFrontendUsage();
  
  let markdown = `# 🔌 API Documentation\n\n`;
  markdown += `> Auto-generated on ${new Date().toISOString()}\n\n`;
  
  // Group by category
  const categories = {
    'Customer APIs': endpoints.filter(e => e.path.startsWith('/api/customer')),
    'Admin APIs': endpoints.filter(e => e.path.startsWith('/api/admin')),
    'Core APIs': endpoints.filter(e => !e.path.startsWith('/api/customer') && !e.path.startsWith('/api/admin'))
  };
  
  Object.entries(categories).forEach(([category, apis]) => {
    if (apis.length === 0) return;
    
    markdown += `## ${category}\n\n`;
    
    apis.forEach(api => {
      markdown += `### \`${api.methods.join(', ')} ${api.path}\`\n\n`;
      markdown += `**Purpose**: ${api.purpose}\n\n`;
      markdown += `**Authentication**: ${api.auth}\n\n`;
      
      if (usage[api.path]) {
        markdown += `**Used by**:\n`;
        usage[api.path].forEach(u => {
          markdown += `- ${u.component} (${u.file})\n`;
        });
        markdown += `\n`;
      } else {
        markdown += `**Used by**: Not detected in frontend scan\n\n`;
      }
      
      markdown += `**File**: \`${api.file}\`\n\n`;
      markdown += `---\n\n`;
    });
  });
  
  return markdown;
}

// Generate dependency graph
function generateDependencyGraph() {
  const usage = scanFrontendUsage();
  
  let mermaid = `\`\`\`mermaid\ngraph TD\n`;
  
  Object.entries(usage).forEach(([endpoint, usages]) => {
    const endpointId = endpoint.replace(/[^a-zA-Z0-9]/g, '_');
    
    usages.forEach((usage, index) => {
      const componentId = usage.component.replace(/[^a-zA-Z0-9]/g, '_');
      mermaid += `    ${componentId} --> ${endpointId}["${endpoint}"]\n`;
    });
  });
  
  mermaid += `\`\`\`\n`;
  return mermaid;
}

// Main execution
async function main() {
  try {
    // Create docs directory if it doesn't exist
    if (!fs.existsSync('docs')) {
      fs.mkdirSync('docs');
    }
    if (!fs.existsSync('docs/apis')) {
      fs.mkdirSync('docs/apis');
    }
    
    console.log('📝 Generating API documentation...');
    const apiDocs = generateApiDocs();
    fs.writeFileSync('docs/apis/generated-api-docs.md', apiDocs);
    
    console.log('📊 Generating dependency graph...');
    const depGraph = generateDependencyGraph();
    fs.writeFileSync('docs/dependency-graph.md', `# 🔗 Dependency Graph\n\n${depGraph}`);
    
    console.log('✅ Documentation generated successfully!');
    console.log('📁 Check the docs/ folder for updated documentation');
    
  } catch (error) {
    console.error('❌ Error generating documentation:', error);
    process.exit(1);
  }
}

main();