#!/usr/bin/env node

/**
 * Setup automation for documentation
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up documentation automation...\n');

// Create GitHub Actions workflow
const githubWorkflow = `name: 📚 Auto-Generate Documentation

on:
  push:
    branches: [ main, develop ]
    paths: 
      - 'src/**/*.ts'
      - 'src/**/*.tsx'
  pull_request:
    branches: [ main ]

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Generate documentation
      run: |
        npm run docs:generate
        node scripts/api-scanner.js
    
    - name: Commit documentation
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add docs/
        git diff --staged --quiet || git commit -m "📚 Auto-update documentation [skip ci]"
        git push
`;

// Create pre-commit hook
const preCommitHook = `#!/bin/sh
# Pre-commit hook to update documentation

echo "🔍 Checking for API changes..."

# Check if any API files were modified
if git diff --cached --name-only | grep -E "src/app/api/.*\\.ts$"; then
    echo "📝 API files changed, updating documentation..."
    npm run docs:generate
    node scripts/api-scanner.js
    
    # Add generated docs to commit
    git add docs/generated/
    echo "✅ Documentation updated and staged"
fi
`;

// Create package.json scripts
const packageScripts = {
  "docs:generate": "node scripts/generate-docs.js",
  "docs:analyze": "node scripts/api-scanner.js", 
  "docs:serve": "npx http-server docs -p 3001 -o",
  "docs:watch": "nodemon --watch src --ext ts,tsx --exec 'npm run docs:generate && npm run docs:analyze'",
  "docs:full": "npm run docs:generate && npm run docs:analyze && npm run analyze:deps",
  "analyze:deps": "madge --image docs/dependency-graph.svg src/ --exclude 'node_modules'",
  "analyze:unused": "ts-unused-exports tsconfig.json --showLineNumber > docs/unused-exports.txt",
  "analyze:bundle": "npx webpack-bundle-analyzer .next/static/chunks/*.js --no-open --report docs/bundle-report.html"
};

// Setup directories
const directories = [
  'docs',
  'docs/generated', 
  'docs/architecture',
  'docs/apis',
  'docs/components',
  '.github',
  '.github/workflows'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Write GitHub workflow
fs.writeFileSync('.github/workflows/docs.yml', githubWorkflow);
console.log('✅ Created GitHub Actions workflow');

// Write pre-commit hook
if (!fs.existsSync('.git/hooks')) {
  fs.mkdirSync('.git/hooks', { recursive: true });
}
fs.writeFileSync('.git/hooks/pre-commit', preCommitHook);
fs.chmodSync('.git/hooks/pre-commit', '755');
console.log('✅ Created pre-commit hook');

// Update package.json
const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts) packageJson.scripts = {};
  
  Object.assign(packageJson.scripts, packageScripts);
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json scripts');
} else {
  console.log('⚠️  package.json not found, please add scripts manually');
}

// Create documentation config
const docsConfig = {
  "name": "E-commerce API Documentation",
  "version": "1.0.0",
  "description": "Auto-generated documentation for the e-commerce system",
  "baseUrl": "/docs",
  "scanPaths": [
    "src/app/api/**/*.ts",
    "src/app/(dashboard)/**/*.tsx"
  ],
  "excludePaths": [
    "node_modules/**",
    ".next/**",
    "dist/**"
  ],
  "outputPath": "docs/generated",
  "features": {
    "apiScanning": true,
    "usageAnalysis": true,
    "dependencyGraphs": true,
    "componentMapping": true
  }
};

fs.writeFileSync('docs/config.json', JSON.stringify(docsConfig, null, 2));
console.log('✅ Created documentation config');

// Create README for docs
const docsReadme = `# 📚 Documentation System

This documentation is automatically generated and updated.

## 🔄 Auto-Generation

Documentation is updated automatically:
- **On every commit** (via pre-commit hook)
- **On every push** (via GitHub Actions)
- **On file changes** (via watch mode)

## 📖 Available Documentation

- [API Reference](./generated/api-reference.md) - Complete API documentation
- [Usage Matrix](./generated/usage-matrix.md) - API usage patterns
- [Dependency Graph](./dependency-graph.svg) - Visual dependencies
- [Component Map](./generated/api-analysis.json) - Component relationships

## 🚀 Commands

\`\`\`bash
# Generate all documentation
npm run docs:full

# Watch for changes and auto-regenerate
npm run docs:watch

# Serve documentation locally
npm run docs:serve

# Analyze specific aspects
npm run analyze:deps      # Dependency graph
npm run analyze:unused    # Unused exports
npm run analyze:bundle    # Bundle analysis
\`\`\`

## 🔧 Configuration

Edit \`docs/config.json\` to customize documentation generation.

---
*Last updated: ${new Date().toLocaleString()}*
`;

fs.writeFileSync('docs/README.md', docsReadme);
console.log('✅ Created docs README');

console.log('\n🎉 Documentation automation setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Run: npm install glob madge dependency-cruiser ts-unused-exports nodemon');
console.log('2. Run: npm run docs:full');
console.log('3. Run: npm run docs:serve');
console.log('4. Commit your changes to trigger automation');

console.log('\n🔄 Automation features enabled:');
console.log('✅ Pre-commit hooks');
console.log('✅ GitHub Actions workflow');
console.log('✅ Watch mode for development');
console.log('✅ Comprehensive API analysis');
console.log('✅ Usage pattern detection');
console.log('✅ Dependency visualization');