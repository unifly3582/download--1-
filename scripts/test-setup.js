#!/usr/bin/env node

/**
 * Test script to verify documentation setup
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing documentation setup...\n');

// Test 1: Check if required files exist
const requiredFiles = [
  'scripts/generate-docs.js',
  'scripts/api-scanner.js', 
  'scripts/setup-automation.js',
  'docs/README.md',
  'docs/api-usage-matrix.md',
  'DOCUMENTATION_SETUP.md'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please run the setup again.');
  process.exit(1);
}

// Test 2: Check if scripts are executable
console.log('\n🔧 Testing script execution...');

try {
  // Test basic doc generation
  console.log('Testing generate-docs.js...');
  require('./generate-docs.js');
  console.log('✅ generate-docs.js syntax is valid');
} catch (error) {
  console.log(`❌ generate-docs.js error: ${error.message}`);
}

try {
  // Test API scanner
  console.log('Testing api-scanner.js...');
  const APIScanner = require('./api-scanner.js');
  console.log('✅ api-scanner.js syntax is valid');
} catch (error) {
  console.log(`❌ api-scanner.js error: ${error.message}`);
}

// Test 3: Check directory structure
console.log('\n📂 Checking directory structure...');

const requiredDirs = ['docs', 'scripts'];
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/ directory exists`);
  } else {
    console.log(`❌ ${dir}/ directory missing`);
  }
});

// Test 4: Scan for API files
console.log('\n🔍 Scanning for API files...');

const glob = require('glob');
try {
  const apiFiles = glob.sync('src/app/api/**/*.ts');
  console.log(`✅ Found ${apiFiles.length} API files`);
  
  if (apiFiles.length > 0) {
    console.log('Sample API files:');
    apiFiles.slice(0, 3).forEach(file => {
      console.log(`   - ${file}`);
    });
    if (apiFiles.length > 3) {
      console.log(`   ... and ${apiFiles.length - 3} more`);
    }
  }
} catch (error) {
  console.log(`❌ Error scanning API files: ${error.message}`);
  console.log('💡 You may need to install glob: npm install -D glob');
}

// Test 5: Check for frontend files
console.log('\n🎨 Scanning for frontend files...');

try {
  const frontendFiles = glob.sync('src/app/(dashboard)/**/*.tsx');
  console.log(`✅ Found ${frontendFiles.length} frontend files`);
  
  if (frontendFiles.length > 0) {
    console.log('Sample frontend files:');
    frontendFiles.slice(0, 3).forEach(file => {
      console.log(`   - ${file}`);
    });
    if (frontendFiles.length > 3) {
      console.log(`   ... and ${frontendFiles.length - 3} more`);
    }
  }
} catch (error) {
  console.log(`❌ Error scanning frontend files: ${error.message}`);
}

console.log('\n🎯 Next Steps:');
console.log('1. Install dependencies: npm install -D glob madge dependency-cruiser ts-unused-exports nodemon http-server');
console.log('2. Run setup: node scripts/setup-automation.js');
console.log('3. Generate docs: npm run docs:generate');
console.log('4. View docs: npm run docs:serve');

console.log('\n✅ Setup test completed!');