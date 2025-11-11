const fs = require('fs');
const path = require('path');

// Function to recursively find all route.ts files
function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to extract HTTP methods and auth requirements from route file
function analyzeRouteFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const methods = [];
  
  // Extract HTTP methods
  const methodRegex = /export const (GET|POST|PUT|DELETE|PATCH)\s*=/g;
  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    methods.push(match[1]);
  }
  
  // Extract auth requirements
  let authType = 'public';
  if (content.includes("withAuth(['admin'])")) {
    authType = 'admin';
  } else if (content.includes("withAuth(['machine'])")) {
    authType = 'machine';
  } else if (content.includes("withAuth(['admin', 'machine'])")) {
    authType = 'admin|machine';
  } else if (content.includes('withRateLimit')) {
    authType = 'rate-limited';
  }
  
  return { methods, authType };
}

// Convert file path to API endpoint
function pathToEndpoint(filePath) {
  const apiPath = filePath
    .replace('/home/archVaibhav/PROJECTS/download--1-/src/app/api/', '')
    .replace('/route.ts', '')
    .replace(/\[([^\]]+)\]/g, ':$1'); // Convert [param] to :param
  
  return `/api/${apiPath}`;
}

// Main analysis
console.log('🔍 Analyzing all API routes...\n');

const apiDir = '/home/archVaibhav/PROJECTS/download--1-/src/app/api';
const routeFiles = findRouteFiles(apiDir);

const apiRoutes = [];

routeFiles.forEach(filePath => {
  const { methods, authType } = analyzeRouteFile(filePath);
  const endpoint = pathToEndpoint(filePath);
  
  methods.forEach(method => {
    apiRoutes.push({
      method,
      endpoint,
      authType,
      filePath: filePath.replace('/home/archVaibhav/PROJECTS/download--1-/', '')
    });
  });
});

// Sort by endpoint
apiRoutes.sort((a, b) => a.endpoint.localeCompare(b.endpoint));

// Group by category
const categories = {
  'Admin': [],
  'Customer': [],
  'Products': [],
  'Orders': [],
  'Tracking': [],
  'Settings': [],
  'System': []
};

apiRoutes.forEach(route => {
  if (route.endpoint.includes('/admin/')) {
    categories['Admin'].push(route);
  } else if (route.endpoint.includes('/customer/')) {
    categories['Customer'].push(route);
  } else if (route.endpoint.includes('/products/')) {
    categories['Products'].push(route);
  } else if (route.endpoint.includes('/orders/')) {
    categories['Orders'].push(route);
  } else if (route.endpoint.includes('/tracking/')) {
    categories['Tracking'].push(route);
  } else if (route.endpoint.includes('/settings/')) {
    categories['Settings'].push(route);
  } else {
    categories['System'].push(route);
  }
});

// Print results
console.log('📊 API ROUTES SUMMARY');
console.log('='.repeat(50));
console.log(`Total API endpoints: ${apiRoutes.length}\n`);

Object.entries(categories).forEach(([category, routes]) => {
  if (routes.length > 0) {
    console.log(`🏷️  ${category.toUpperCase()} APIs (${routes.length})`);
    console.log('-'.repeat(30));
    
    routes.forEach(route => {
      const authIcon = {
        'admin': '🔐',
        'machine': '🤖',
        'admin|machine': '🔐🤖',
        'rate-limited': '⏱️',
        'public': '🌐'
      }[route.authType] || '❓';
      
      console.log(`${authIcon} ${route.method.padEnd(6)} ${route.endpoint}`);
    });
    console.log('');
  }
});

// Generate Postman collection format
console.log('📬 POSTMAN COLLECTION FORMAT');
console.log('='.repeat(50));

const baseUrl = 'http://localhost:9006';
const postmanCollection = {
  info: {
    name: 'Buggly Admin Panel APIs',
    description: 'Complete API collection for the admin panel'
  },
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{idToken}}', type: 'string' }]
  },
  variable: [
    { key: 'baseUrl', value: baseUrl },
    { key: 'idToken', value: 'PASTE_YOUR_ID_TOKEN_HERE' }
  ],
  item: []
};

Object.entries(categories).forEach(([category, routes]) => {
  if (routes.length > 0) {
    const folder = {
      name: category,
      item: []
    };
    
    routes.forEach(route => {
      const item = {
        name: `${route.method} ${route.endpoint}`,
        request: {
          method: route.method,
          url: `{{baseUrl}}${route.endpoint}`,
          header: [
            { key: 'Content-Type', value: 'application/json' }
          ]
        }
      };
      
      // Add auth header if needed
      if (route.authType === 'admin' || route.authType.includes('admin')) {
        item.request.header.push({
          key: 'Authorization',
          value: 'Bearer {{idToken}}'
        });
      } else if (route.authType === 'machine') {
        item.request.header.push({
          key: 'X-API-Key',
          value: '{{machineApiKey}}'
        });
      }
      
      // Add sample body for POST/PUT methods
      if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
        item.request.body = {
          mode: 'raw',
          raw: JSON.stringify({ /* Add sample data */ }, null, 2)
        };
      }
      
      folder.item.push(item);
    });
    
    postmanCollection.item.push(folder);
  }
});

console.log('Copy this JSON to import into Postman:');
console.log(JSON.stringify(postmanCollection, null, 2));