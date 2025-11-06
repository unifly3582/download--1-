#!/usr/bin/env node

/**
 * Advanced API Scanner
 * Generates detailed API documentation with usage patterns
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class APIScanner {
  constructor() {
    this.endpoints = new Map();
    this.frontendUsage = new Map();
    this.components = new Map();
  }

  // Scan API endpoints with detailed analysis
  scanAPIs() {
    console.log('🔍 Scanning API endpoints...');
    
    const apiFiles = glob.sync('src/app/api/**/*.ts');
    
    apiFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const endpoint = this.extractEndpointInfo(file, content);
      
      if (endpoint) {
        this.endpoints.set(endpoint.path, endpoint);
      }
    });
    
    console.log(`📊 Found ${this.endpoints.size} API endpoints`);
  }

  extractEndpointInfo(file, content) {
    const relativePath = file.replace('src/app/api', '/api').replace('/route.ts', '');
    
    // Extract HTTP methods
    const methods = [];
    const methodRegex = /export\s+(?:const|async\s+function)\s+(GET|POST|PUT|DELETE|PATCH)/g;
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push(match[1]);
    }
    
    if (methods.length === 0) return null;
    
    // Extract authentication info
    const authInfo = this.extractAuthInfo(content);
    
    // Extract JSDoc comments
    const docs = this.extractJSDoc(content);
    
    // Extract parameters
    const params = this.extractParameters(content);
    
    // Extract response structure
    const responses = this.extractResponses(content);
    
    return {
      path: relativePath,
      methods,
      auth: authInfo,
      documentation: docs,
      parameters: params,
      responses: responses,
      file: file,
      lastModified: fs.statSync(file).mtime
    };
  }

  extractAuthInfo(content) {
    if (content.includes("withAuth(['admin'])")) {
      return { required: true, level: 'admin', roles: ['admin'] };
    }
    if (content.includes("withAuth(['machine'])")) {
      return { required: true, level: 'machine', roles: ['machine'] };
    }
    if (content.includes('withAuth')) {
      return { required: true, level: 'user', roles: ['user'] };
    }
    return { required: false, level: 'public', roles: [] };
  }

  extractJSDoc(content) {
    const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;
    const docs = [];
    let match;
    
    while ((match = jsdocRegex.exec(content)) !== null) {
      const docText = match[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, ''))
        .filter(line => line.trim())
        .join(' ');
      
      if (docText.length > 10) {
        docs.push(docText);
      }
    }
    
    return docs;
  }

  extractParameters(content) {
    const params = [];
    
    // Extract query parameters
    const queryRegex = /searchParams\.get\(['"`]([^'"`]+)['"`]\)/g;
    let match;
    while ((match = queryRegex.exec(content)) !== null) {
      params.push({ name: match[1], type: 'query', required: false });
    }
    
    // Extract path parameters
    const pathRegex = /params\.([a-zA-Z]+)/g;
    while ((match = pathRegex.exec(content)) !== null) {
      params.push({ name: match[1], type: 'path', required: true });
    }
    
    return params;
  }

  extractResponses(content) {
    const responses = [];
    
    // Extract NextResponse.json calls
    const responseRegex = /NextResponse\.json\(([\s\S]*?)\)/g;
    let match;
    
    while ((match = responseRegex.exec(content)) !== null) {
      try {
        // Simple extraction - could be enhanced
        const responseText = match[1];
        if (responseText.includes('success: true')) {
          responses.push({ status: 200, type: 'success' });
        }
        if (responseText.includes('status: 400')) {
          responses.push({ status: 400, type: 'error' });
        }
        if (responseText.includes('status: 500')) {
          responses.push({ status: 500, type: 'error' });
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    return responses;
  }

  // Scan frontend usage
  scanFrontendUsage() {
    console.log('🔍 Scanning frontend usage...');
    
    const frontendFiles = glob.sync('src/app/(dashboard)/**/*.tsx');
    
    frontendFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      this.analyzeFrontendFile(file, content);
    });
    
    console.log(`📊 Analyzed ${frontendFiles.length} frontend files`);
  }

  analyzeFrontendFile(file, content) {
    const componentName = path.basename(file, '.tsx');
    
    // Find API calls
    const apiCallRegex = /(?:fetch|authenticatedFetch)\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
    let match;
    
    while ((match = apiCallRegex.exec(content)) !== null) {
      const endpoint = match[1].split('?')[0]; // Remove query params for matching
      
      if (!this.frontendUsage.has(endpoint)) {
        this.frontendUsage.set(endpoint, []);
      }
      
      this.frontendUsage.get(endpoint).push({
        file: file.replace('src/', ''),
        component: componentName,
        line: this.getLineNumber(content, match.index)
      });
    }
    
    // Store component info
    this.components.set(componentName, {
      file: file.replace('src/', ''),
      exports: this.extractExports(content),
      imports: this.extractImports(content)
    });
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  extractExports(content) {
    const exportRegex = /export\s+(?:default\s+)?(?:function|const|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    const exports = [];
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }

  extractImports(content) {
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  // Generate comprehensive documentation
  generateDocumentation() {
    console.log('📝 Generating comprehensive documentation...');
    
    const docs = {
      overview: this.generateOverview(),
      apiReference: this.generateAPIReference(),
      usageMatrix: this.generateUsageMatrix(),
      componentMap: this.generateComponentMap(),
      dependencyGraph: this.generateDependencyGraph()
    };
    
    return docs;
  }

  generateOverview() {
    const totalEndpoints = this.endpoints.size;
    const publicEndpoints = Array.from(this.endpoints.values()).filter(e => !e.auth.required).length;
    const adminEndpoints = Array.from(this.endpoints.values()).filter(e => e.auth.level === 'admin').length;
    
    return {
      totalEndpoints,
      publicEndpoints,
      adminEndpoints,
      lastUpdated: new Date().toISOString(),
      coverage: {
        documented: Array.from(this.endpoints.values()).filter(e => e.documentation.length > 0).length,
        withUsage: Array.from(this.endpoints.keys()).filter(path => this.frontendUsage.has(path)).length
      }
    };
  }

  generateAPIReference() {
    const reference = {};
    
    this.endpoints.forEach((endpoint, path) => {
      reference[path] = {
        methods: endpoint.methods,
        auth: endpoint.auth,
        documentation: endpoint.documentation,
        parameters: endpoint.parameters,
        responses: endpoint.responses,
        usage: this.frontendUsage.get(path) || [],
        file: endpoint.file
      };
    });
    
    return reference;
  }

  generateUsageMatrix() {
    const matrix = [];
    
    this.endpoints.forEach((endpoint, path) => {
      const usage = this.frontendUsage.get(path) || [];
      
      matrix.push({
        endpoint: path,
        methods: endpoint.methods,
        auth: endpoint.auth.level,
        usedBy: usage.map(u => u.component),
        usageCount: usage.length,
        lastModified: endpoint.lastModified
      });
    });
    
    return matrix.sort((a, b) => b.usageCount - a.usageCount);
  }

  generateComponentMap() {
    const componentMap = {};
    
    this.components.forEach((component, name) => {
      const usedAPIs = [];
      
      this.frontendUsage.forEach((usage, endpoint) => {
        if (usage.some(u => u.component === name)) {
          usedAPIs.push(endpoint);
        }
      });
      
      componentMap[name] = {
        file: component.file,
        exports: component.exports,
        imports: component.imports,
        usedAPIs: usedAPIs
      };
    });
    
    return componentMap;
  }

  generateDependencyGraph() {
    const nodes = [];
    const edges = [];
    
    // Add API nodes
    this.endpoints.forEach((endpoint, path) => {
      nodes.push({
        id: path,
        type: 'api',
        auth: endpoint.auth.level,
        methods: endpoint.methods
      });
    });
    
    // Add component nodes and edges
    this.components.forEach((component, name) => {
      nodes.push({
        id: name,
        type: 'component',
        file: component.file
      });
      
      // Add edges for API usage
      this.frontendUsage.forEach((usage, endpoint) => {
        if (usage.some(u => u.component === name)) {
          edges.push({
            from: name,
            to: endpoint,
            type: 'uses'
          });
        }
      });
    });
    
    return { nodes, edges };
  }

  // Save documentation to files
  saveDocumentation(docs) {
    console.log('💾 Saving documentation...');
    
    // Ensure docs directory exists
    if (!fs.existsSync('docs')) fs.mkdirSync('docs');
    if (!fs.existsSync('docs/generated')) fs.mkdirSync('docs/generated');
    
    // Save JSON data
    fs.writeFileSync('docs/generated/api-analysis.json', JSON.stringify(docs, null, 2));
    
    // Generate markdown files
    this.generateMarkdownDocs(docs);
    
    console.log('✅ Documentation saved to docs/generated/');
  }

  generateMarkdownDocs(docs) {
    // API Reference
    let apiMd = `# 🔌 API Reference\n\n`;
    apiMd += `> Auto-generated on ${new Date().toLocaleString()}\n\n`;
    apiMd += `## 📊 Overview\n\n`;
    apiMd += `- **Total Endpoints**: ${docs.overview.totalEndpoints}\n`;
    apiMd += `- **Public Endpoints**: ${docs.overview.publicEndpoints}\n`;
    apiMd += `- **Admin Endpoints**: ${docs.overview.adminEndpoints}\n`;
    apiMd += `- **Documentation Coverage**: ${docs.overview.coverage.documented}/${docs.overview.totalEndpoints}\n`;
    apiMd += `- **Usage Coverage**: ${docs.overview.coverage.withUsage}/${docs.overview.totalEndpoints}\n\n`;
    
    Object.entries(docs.apiReference).forEach(([path, api]) => {
      apiMd += `## \`${api.methods.join(', ')} ${path}\`\n\n`;
      apiMd += `**Auth**: ${api.auth.level} ${api.auth.required ? '🔒' : '🌐'}\n\n`;
      
      if (api.documentation.length > 0) {
        apiMd += `**Description**: ${api.documentation[0]}\n\n`;
      }
      
      if (api.parameters.length > 0) {
        apiMd += `**Parameters**:\n`;
        api.parameters.forEach(param => {
          apiMd += `- \`${param.name}\` (${param.type}) ${param.required ? '**required**' : 'optional'}\n`;
        });
        apiMd += `\n`;
      }
      
      if (api.usage.length > 0) {
        apiMd += `**Used by**:\n`;
        api.usage.forEach(usage => {
          apiMd += `- ${usage.component} (${usage.file}:${usage.line})\n`;
        });
        apiMd += `\n`;
      }
      
      apiMd += `---\n\n`;
    });
    
    fs.writeFileSync('docs/generated/api-reference.md', apiMd);
    
    // Usage Matrix
    let matrixMd = `# 📊 API Usage Matrix\n\n`;
    matrixMd += `| Endpoint | Methods | Auth | Used By | Usage Count |\n`;
    matrixMd += `|----------|---------|------|---------|-------------|\n`;
    
    docs.usageMatrix.forEach(item => {
      const usedBy = item.usedBy.length > 0 ? item.usedBy.join(', ') : 'Unused';
      matrixMd += `| \`${item.endpoint}\` | ${item.methods.join(', ')} | ${item.auth} | ${usedBy} | ${item.usageCount} |\n`;
    });
    
    fs.writeFileSync('docs/generated/usage-matrix.md', matrixMd);
  }

  // Main execution
  async run() {
    console.log('🚀 Starting comprehensive API analysis...\n');
    
    this.scanAPIs();
    this.scanFrontendUsage();
    
    const docs = this.generateDocumentation();
    this.saveDocumentation(docs);
    
    console.log('\n✅ Analysis complete!');
    console.log('📁 Check docs/generated/ for detailed documentation');
  }
}

// Run the scanner
if (require.main === module) {
  const scanner = new APIScanner();
  scanner.run().catch(console.error);
}

module.exports = APIScanner;