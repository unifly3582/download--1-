# 📚 Documentation Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install -D glob madge dependency-cruiser ts-unused-exports nodemon http-server
```

### 2. Setup Automation
```bash
node scripts/setup-automation.js
```

### 3. Generate Initial Documentation
```bash
npm run docs:full
```

### 4. View Documentation
```bash
npm run docs:serve
# Opens http://localhost:3001
```

## 🔄 Daily Workflow

### Development Mode (Auto-regenerate on changes)
```bash
npm run docs:watch
```

### Manual Updates
```bash
npm run docs:generate    # Basic documentation
npm run docs:analyze     # Advanced API analysis
npm run docs:full        # Everything
```

## 📊 Analysis Commands

```bash
# Dependency visualization
npm run analyze:deps

# Find unused exports
npm run analyze:unused

# Bundle analysis
npm run analyze:bundle
```

## 🤖 Automation Features

### ✅ Pre-commit Hooks
- Automatically updates docs when API files change
- Runs before every git commit

### ✅ GitHub Actions
- Updates documentation on every push
- Runs on pull requests
- Commits changes back to repo

### ✅ Watch Mode
- Monitors file changes during development
- Instantly regenerates documentation

## 📁 Generated Documentation

After running the setup, you'll have:

```
docs/
├── README.md                           # This guide
├── config.json                         # Configuration
├── api-usage-matrix.md                 # Manual overview
├── generated/
│   ├── api-reference.md               # Complete API docs
│   ├── usage-matrix.md                # Usage patterns
│   └── api-analysis.json              # Raw analysis data
├── dependency-graph.svg               # Visual dependencies
├── unused-exports.txt                 # Cleanup suggestions
└── bundle-report.html                 # Bundle analysis
```

## 🎯 What Gets Tracked

### API Endpoints
- HTTP methods (GET, POST, PUT, DELETE)
- Authentication requirements
- Parameters and responses
- JSDoc documentation
- File locations

### Frontend Usage
- Which components use which APIs
- Line numbers of API calls
- Import/export relationships
- Component dependencies

### System Health
- Unused exports
- Dependency cycles
- Bundle size analysis
- Documentation coverage

## 🔧 Customization

Edit `docs/config.json` to:
- Change scan paths
- Exclude certain files
- Enable/disable features
- Modify output formats

## 🚨 Troubleshooting

### Documentation not updating?
```bash
# Clear cache and regenerate
rm -rf docs/generated
npm run docs:full
```

### Pre-commit hook not working?
```bash
# Reinstall hook
chmod +x .git/hooks/pre-commit
```

### Missing dependencies?
```bash
# Reinstall all tools
npm install -D glob madge dependency-cruiser ts-unused-exports nodemon http-server
```

## 🎉 Success Indicators

You'll know it's working when:
- ✅ `docs/generated/` folder appears with files
- ✅ API changes trigger documentation updates
- ✅ `npm run docs:serve` shows your documentation
- ✅ GitHub Actions run on commits (if using GitHub)

## 📞 Need Help?

Common issues and solutions:
1. **Permission errors**: Run `chmod +x scripts/*.js`
2. **Missing files**: Ensure all scripts are in place
3. **Node errors**: Check Node.js version (16+ recommended)

---
*Setup created: ${new Date().toLocaleString()}*