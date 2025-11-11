// Orders API Analysis Script
const fs = require('fs');
const path = require('path');

// Function to analyze order-related route files
function analyzeOrderRoutes() {
  const orderRoutes = [
    '/home/archVaibhav/PROJECTS/download--1-/src/app/api/orders/route.ts',
    '/home/archVaibhav/PROJECTS/download--1-/src/app/api/orders/[orderId]/route.ts',
    '/home/archVaibhav/PROJECTS/download--1-/src/app/api/orders/[orderId]/approve/route.ts',
    '/home/archVaibhav/PROJECTS/download--1-/src/app/api/orders/[orderId]/ship/route.ts',
    '/home/archVaibhav/PROJECTS/download--1-/src/app/api/orders/[orderId]/update-dimensions/route.ts',
    '/home/archVaibhav/PROJECTS/download--1-/src/app/api/orders/bulk/route.ts',
    '/home/archVaibhav/PROJECTS/download--1-/src/app/api/orders/bulk-optimized/route.ts',
    '/home/archVaibhav/PROJECTS/download--1-/src/app/api/orders/optimized/route.ts',
    '/home/archVaibhav/PROJECTS/download--1-/src/app/api/admin/orders/[orderId]/status/route.ts',
    '/home/archVaibhav/PROJECTS/download--1-/src/app/api/customer/orders/route.ts',
    '/home/archVaibhav/PROJECTS/download--1-/src/app/api/customer/orders/create/route.ts',
    '/home/archVaibhav/PROJECTS/download--1-/src/app/api/customer/orders/[orderId]/route.ts'
  ];

  const routes = [];

  orderRoutes.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = filePath.replace('/home/archVaibhav/PROJECTS/download--1-/src/app/api/', '');
      const endpoint = '/' + relativePath.replace('/route.ts', '').replace(/\[([^\]]+)\]/g, ':$1');
      
      // Extract HTTP methods
      const methods = [];
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
      }
      
      // Extract function descriptions from comments
      const descriptions = [];
      const commentRegex = /\/\*\*[\s\S]*?\*\//g;
      const comments = content.match(commentRegex) || [];
      comments.forEach(comment => {
        const lines = comment.split('\n');
        lines.forEach(line => {
          if (line.includes('*') && !line.includes('/**') && !line.includes('*/')) {
            const desc = line.replace(/\s*\*\s*/, '').trim();
            if (desc && !desc.startsWith('@')) {
              descriptions.push(desc);
            }
          }
        });
      });

      routes.push({
        endpoint: `/api${endpoint}`,
        methods,
        authType,
        descriptions: descriptions.slice(0, 2), // Take first 2 descriptions
        filePath: relativePath
      });
    }
  });

  return routes;
}

// Generate comprehensive documentation
function generateOrdersAPIDocs() {
  const routes = analyzeOrderRoutes();
  
  console.log('📋 ORDERS API COMPLETE DOCUMENTATION');
  console.log('='.repeat(60));
  console.log(`Total Order-related endpoints: ${routes.length}\n`);

  // Group by category
  const categories = {
    'Admin Orders': routes.filter(r => r.endpoint.includes('/admin/orders')),
    'Customer Orders': routes.filter(r => r.endpoint.includes('/customer/orders')),
    'General Orders': routes.filter(r => r.endpoint.startsWith('/api/orders') && !r.endpoint.includes('/admin/') && !r.endpoint.includes('/customer/'))
  };

  Object.entries(categories).forEach(([category, categoryRoutes]) => {
    if (categoryRoutes.length > 0) {
      console.log(`🏷️  ${category.toUpperCase()} (${categoryRoutes.length} endpoints)`);
      console.log('-'.repeat(50));
      
      categoryRoutes.forEach(route => {
        const authIcon = {
          'admin': '🔐',
          'machine': '🤖', 
          'admin|machine': '🔐🤖',
          'public': '🌐'
        }[route.authType] || '❓';
        
        route.methods.forEach(method => {
          console.log(`${authIcon} ${method.padEnd(6)} ${route.endpoint}`);
          if (route.descriptions.length > 0) {
            console.log(`        📝 ${route.descriptions[0]}`);
          }
        });
      });
      console.log('');
    }
  });

  return routes;
}

// Generate detailed protocol information
function generateProtocolInfo() {
  console.log('📡 ORDER API PROTOCOLS & AUTHENTICATION');
  console.log('='.repeat(60));
  
  console.log(`
🔐 ADMIN AUTHENTICATION
  Header: Authorization: Bearer <firebase_id_token>
  Required: User must have admin claim or be whitelisted email
  Emails: vaibhav@gmail.com, uniflyinsect@gmail.com

🤖 MACHINE AUTHENTICATION  
  Header: X-API-Key: <AI_AGENT_API_KEY>
  Key: From environment variable AI_AGENT_API_KEY

🌐 PUBLIC ENDPOINTS
  No authentication required
  May have rate limiting

📋 REQUEST/RESPONSE FORMAT
  Content-Type: application/json
  Success: { success: true, data: {...}, ... }
  Error: { success: false, error: "message" }
  `);
}

// Run analysis
const routes = generateOrdersAPIDocs();
generateProtocolInfo();

// Generate sample requests
console.log('🚀 SAMPLE REQUESTS');
console.log('='.repeat(40));

const samples = [
  {
    title: 'Get All Orders (Admin)',
    method: 'GET',
    url: 'http://localhost:9006/api/orders',
    headers: ['Authorization: Bearer <token>', 'Content-Type: application/json'],
    auth: 'admin'
  },
  {
    title: 'Create Customer Order',
    method: 'POST', 
    url: 'http://localhost:9006/api/customer/orders/create',
    headers: ['Content-Type: application/json'],
    body: {
      customerId: 'CUST_123',
      items: [{ productId: 'PROD_1', quantity: 2, price: 100 }],
      shippingAddress: { /* address object */ }
    },
    auth: 'public'
  },
  {
    title: 'Approve Order',
    method: 'POST',
    url: 'http://localhost:9006/api/orders/:orderId/approve', 
    headers: ['Authorization: Bearer <token>', 'Content-Type: application/json'],
    auth: 'admin'
  },
  {
    title: 'Ship Order',
    method: 'POST',
    url: 'http://localhost:9006/api/orders/:orderId/ship',
    headers: ['Authorization: Bearer <token>', 'Content-Type: application/json'],
    body: {
      courierName: 'Delhivery',
      trackingNumber: 'DHL123456'
    },
    auth: 'admin|machine'
  }
];

samples.forEach((sample, index) => {
  console.log(`${index + 1}. ${sample.title}`);
  console.log(`   ${sample.method} ${sample.url}`);
  console.log(`   Auth: ${sample.auth}`);
  sample.headers.forEach(header => {
    console.log(`   Header: ${header}`);
  });
  if (sample.body) {
    console.log(`   Body: ${JSON.stringify(sample.body, null, 2)}`);
  }
  console.log('');
});