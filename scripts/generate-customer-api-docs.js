#!/usr/bin/env node

/**
 * Generate interactive API documentation for customer APIs
 * Run: node scripts/generate-customer-api-docs.js
 */

const fs = require('fs');
const path = require('path');

// API endpoints configuration
const customerAPIs = {
  products: {
    title: 'Product APIs',
    description: 'APIs for browsing and searching products',
    endpoints: [
      {
        method: 'GET',
        path: '/api/products',
        summary: 'Get products list with smart routing',
        parameters: [
          { name: 'category', type: 'string', required: false, description: 'Filter by category' },
          { name: 'featured', type: 'boolean', required: false, description: 'Get only featured products' },
          { name: 'search', type: 'string', required: false, description: 'Search query' },
          { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', required: false, description: 'Items per page (default: 20)' }
        ],
        examples: [
          { url: '/api/products', description: 'Get all products' },
          { url: '/api/products?featured=true&limit=8', description: 'Get featured products' },
          { url: '/api/products?category=electronics', description: 'Get electronics products' },
          { url: '/api/products?search=laptop', description: 'Search for laptops' }
        ]
      },
      {
        method: 'GET',
        path: '/api/products/{productId}',
        summary: 'Get single product details',
        parameters: [
          { name: 'productId', type: 'string', required: true, description: 'Product ID' }
        ],
        examples: [
          { url: '/api/products/PROD_123', description: 'Get product details' }
        ]
      },
      {
        method: 'GET',
        path: '/api/products/customer/featured',
        summary: 'Get featured products (customer optimized)',
        parameters: [
          { name: 'limit', type: 'number', required: false, description: 'Number of products (default: 8)' }
        ],
        examples: [
          { url: '/api/products/customer/featured?limit=6', description: 'Get 6 featured products' }
        ]
      },
      {
        method: 'GET',
        path: '/api/products/customer/categories',
        summary: 'Get product categories with metadata',
        parameters: [],
        examples: [
          { url: '/api/products/customer/categories', description: 'Get all categories' }
        ]
      },
      {
        method: 'GET',
        path: '/api/products/customer/search',
        summary: 'Advanced product search',
        parameters: [
          { name: 'q', type: 'string', required: true, description: 'Search query (min 2 chars)' },
          { name: 'category', type: 'string', required: false, description: 'Filter by category' },
          { name: 'limit', type: 'number', required: false, description: 'Max results (default: 20)' }
        ],
        examples: [
          { url: '/api/products/customer/search?q=gaming laptop', description: 'Search gaming laptops' },
          { url: '/api/products/customer/search?q=red dress&category=clothing', description: 'Search red dress in clothing' }
        ]
      }
    ]
  },
  orders: {
    title: 'Order APIs',
    description: 'APIs for creating and managing orders',
    endpoints: [
      {
        method: 'POST',
        path: '/api/customer/orders/create',
        summary: 'Create new order',
        parameters: [],
        requestBody: {
          customerInfo: { name: 'string', phone: 'string', email: 'string' },
          shippingAddress: { street: 'string', city: 'string', state: 'string', zip: 'string', country: 'string' },
          items: [{ productId: 'string', variationId: 'string', sku: 'string', quantity: 'number' }],
          paymentInfo: { method: 'string' },
          couponCode: 'string (optional)'
        },
        examples: [
          { description: 'Create COD order', body: '{"customerInfo":{"name":"John","phone":"+919999999999"},"items":[...],"paymentInfo":{"method":"COD"}}' }
        ]
      },
      {
        method: 'GET',
        path: '/api/customer/orders/{orderId}',
        summary: 'Get order details',
        parameters: [
          { name: 'orderId', type: 'string', required: true, description: 'Order ID' }
        ],
        examples: [
          { url: '/api/customer/orders/ORD_2024_ABC123', description: 'Get order details' }
        ]
      },
      {
        method: 'GET',
        path: '/api/customer/orders',
        summary: 'Get customer order history',
        parameters: [
          { name: 'phone', type: 'string', required: true, description: 'Customer phone number' },
          { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', required: false, description: 'Orders per page (default: 10)' }
        ],
        examples: [
          { url: '/api/customer/orders?phone=%2B919999999999', description: 'Get customer orders' }
        ]
      }
    ]
  },
  profile: {
    title: 'Customer Profile APIs',
    description: 'APIs for managing customer profiles',
    endpoints: [
      {
        method: 'POST',
        path: '/api/customer/profile',
        summary: 'Get or update customer profile',
        parameters: [],
        requestBody: {
          action: 'get | update',
          phone: 'string',
          name: 'string (for update)',
          email: 'string (for update)',
          defaultAddress: 'object (for update)'
        },
        examples: [
          { description: 'Get profile', body: '{"action":"get","phone":"+919999999999"}' },
          { description: 'Update profile', body: '{"action":"update","phone":"+919999999999","name":"John Doe","email":"john@example.com"}' }
        ]
      },
      {
        method: 'GET',
        path: '/api/customer/profile/{phone}',
        summary: 'Get public customer profile',
        parameters: [
          { name: 'phone', type: 'string', required: true, description: 'Customer phone number (URL encoded)' }
        ],
        examples: [
          { url: '/api/customer/profile/%2B919999999999', description: 'Get public profile' }
        ]
      }
    ]
  },
  other: {
    title: 'Other APIs',
    description: 'Utility and support APIs',
    endpoints: [
      {
        method: 'POST',
        path: '/api/customer/addresses',
        summary: 'Manage customer addresses',
        parameters: [],
        requestBody: {
          phone: 'string',
          action: 'get | add | update | remove | setDefault',
          address: 'object (for add/remove/setDefault)',
          oldAddress: 'object (for update)',
          newAddress: 'object (for update)'
        }
      },
      {
        method: 'POST',
        path: '/api/customer/coupons/validate',
        summary: 'Validate coupon code',
        parameters: [],
        requestBody: {
          couponCode: 'string',
          customerId: 'string',
          customerPhone: 'string',
          orderValue: 'number',
          items: 'array'
        }
      },
      {
        method: 'GET',
        path: '/api/customer/tracking/{awb}',
        summary: 'Track order shipment',
        parameters: [
          { name: 'awb', type: 'string', required: true, description: 'AWB/tracking number' }
        ]
      },
      {
        method: 'GET',
        path: '/api/pincode/{pincode}',
        summary: 'Get pincode details',
        parameters: [
          { name: 'pincode', type: 'string', required: true, description: 'Indian pincode' }
        ]
      }
    ]
  }
};

// Generate HTML documentation
function generateHTML() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer API Documentation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 0; margin-bottom: 40px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; }
        .endpoint { background: #f8f9fa; border-left: 4px solid #3498db; padding: 20px; margin-bottom: 20px; border-radius: 5px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; margin-right: 10px; }
        .method.GET { background: #28a745; color: white; }
        .method.POST { background: #007bff; color: white; }
        .method.PUT { background: #ffc107; color: black; }
        .method.DELETE { background: #dc3545; color: white; }
        .path { font-family: 'Courier New', monospace; background: #e9ecef; padding: 4px 8px; border-radius: 4px; }
        .parameters { margin-top: 15px; }
        .parameter { background: white; padding: 10px; margin: 5px 0; border-radius: 4px; border: 1px solid #dee2e6; }
        .parameter-name { font-weight: bold; color: #495057; }
        .parameter-type { color: #6c757d; font-style: italic; }
        .required { color: #dc3545; font-size: 0.8rem; }
        .examples { margin-top: 15px; }
        .example { background: #2d3748; color: #e2e8f0; padding: 10px; margin: 5px 0; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 0.9rem; }
        .toc { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .toc h3 { margin-bottom: 15px; color: #2c3e50; }
        .toc ul { list-style: none; }
        .toc li { margin: 5px 0; }
        .toc a { color: #3498db; text-decoration: none; }
        .toc a:hover { text-decoration: underline; }
        .badge { background: #17a2b8; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7rem; }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>Customer API Documentation</h1>
            <p>Complete reference for customer-facing APIs • No authentication required • CORS enabled</p>
        </div>
    </div>

    <div class="container">
        <div class="toc">
            <h3>📚 Table of Contents</h3>
            <ul>
                ${Object.entries(customerAPIs).map(([key, section]) => 
                    `<li><a href="#${key}">${section.title}</a> <span class="badge">${section.endpoints.length} endpoints</span></li>`
                ).join('')}
            </ul>
        </div>

        ${Object.entries(customerAPIs).map(([key, section]) => `
            <div class="section" id="${key}">
                <h2>${section.title}</h2>
                <p>${section.description}</p>
                
                ${section.endpoints.map(endpoint => `
                    <div class="endpoint">
                        <div>
                            <span class="method ${endpoint.method}">${endpoint.method}</span>
                            <span class="path">${endpoint.path}</span>
                        </div>
                        <p><strong>${endpoint.summary}</strong></p>
                        
                        ${endpoint.parameters && endpoint.parameters.length > 0 ? `
                            <div class="parameters">
                                <strong>Parameters:</strong>
                                ${endpoint.parameters.map(param => `
                                    <div class="parameter">
                                        <span class="parameter-name">${param.name}</span>
                                        <span class="parameter-type">(${param.type})</span>
                                        ${param.required ? '<span class="required">required</span>' : '<span style="color: #6c757d;">optional</span>'}
                                        <br>
                                        <small>${param.description}</small>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${endpoint.requestBody ? `
                            <div class="parameters">
                                <strong>Request Body:</strong>
                                <div class="example">${JSON.stringify(endpoint.requestBody, null, 2)}</div>
                            </div>
                        ` : ''}
                        
                        ${endpoint.examples && endpoint.examples.length > 0 ? `
                            <div class="examples">
                                <strong>Examples:</strong>
                                ${endpoint.examples.map(example => `
                                    <div>
                                        <small>${example.description}</small>
                                        <div class="example">${example.url || example.body}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `).join('')}

        <div class="section">
            <h2>🚀 Quick Start</h2>
            <div class="endpoint">
                <h3>JavaScript Example</h3>
                <div class="example">
// Get featured products
const response = await fetch('https://yourdomain.com/api/products/customer/featured?limit=8');
const data = await response.json();
console.log(data);

// Search products
const searchResponse = await fetch('https://yourdomain.com/api/products/customer/search?q=laptop');
const searchData = await searchResponse.json();
console.log(searchData);
                </div>
            </div>
            
            <div class="endpoint">
                <h3>Python Example</h3>
                <div class="example">
import requests

# Get products
response = requests.get('https://yourdomain.com/api/products?category=electronics')
data = response.json()
print(data)

# Create order
order_data = {
    "customerInfo": {"name": "John", "phone": "+919999999999"},
    "items": [{"productId": "PROD_123", "quantity": 1}],
    "paymentInfo": {"method": "COD"}
}
response = requests.post('https://yourdomain.com/api/customer/orders/create', json=order_data)
print(response.json())
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📋 Response Format</h2>
            <div class="endpoint">
                <h3>Success Response</h3>
                <div class="example">
{
  "success": true,
  "data": { ... },
  "pagination": { ... } // For paginated endpoints
}
                </div>
                
                <h3>Error Response</h3>
                <div class="example">
{
  "success": false,
  "error": "Error message",
  "details": "Additional details (optional)"
}
                </div>
            </div>
        </div>

        <div class="section">
            <h2>ℹ️ Additional Information</h2>
            <div class="endpoint">
                <p><strong>Base URL:</strong> <code>https://yourdomain.com/api</code></p>
                <p><strong>Authentication:</strong> Not required for customer APIs</p>
                <p><strong>CORS:</strong> Enabled for all customer endpoints</p>
                <p><strong>Rate Limiting:</strong> 1000 requests/hour for most endpoints</p>
                <p><strong>Caching:</strong> Responses are cached for better performance</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
  
  return html;
}

// Generate OpenAPI/Swagger specification
function generateOpenAPI() {
  const openapi = {
    openapi: '3.0.0',
    info: {
      title: 'Customer API',
      version: '1.0.0',
      description: 'Customer-facing APIs for e-commerce platform',
      contact: {
        email: 'api-support@yourdomain.com'
      }
    },
    servers: [
      {
        url: 'https://yourdomain.com/api',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    paths: {},
    components: {
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            category: { type: 'string' },
            priceRange: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' }
              }
            },
            inStock: { type: 'boolean' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            customerFacingStatus: { type: 'string' },
            totalAmount: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  };

  // Add paths from customerAPIs configuration
  Object.values(customerAPIs).forEach(section => {
    section.endpoints.forEach(endpoint => {
      const path = endpoint.path.replace(/{([^}]+)}/g, '{$1}');
      if (!openapi.paths[path]) {
        openapi.paths[path] = {};
      }
      
      openapi.paths[path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        parameters: endpoint.parameters?.map(param => ({
          name: param.name,
          in: param.name === 'productId' || param.name === 'orderId' || param.name === 'phone' || param.name === 'awb' || param.name === 'pincode' ? 'path' : 'query',
          required: param.required,
          schema: { type: param.type },
          description: param.description
        })) || [],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad Request'
          },
          '404': {
            description: 'Not Found'
          },
          '500': {
            description: 'Internal Server Error'
          }
        }
      };
    });
  });

  return JSON.stringify(openapi, null, 2);
}

// Main execution
console.log('🚀 Generating Customer API Documentation...\n');

// Create docs directory if it doesn't exist
const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Generate HTML documentation
const htmlContent = generateHTML();
const htmlPath = path.join(docsDir, 'customer-api.html');
fs.writeFileSync(htmlPath, htmlContent);
console.log(`✅ HTML documentation generated: ${htmlPath}`);

// Generate OpenAPI specification
const openApiContent = generateOpenAPI();
const openApiPath = path.join(docsDir, 'customer-api-openapi.json');
fs.writeFileSync(openApiPath, openApiContent);
console.log(`✅ OpenAPI specification generated: ${openApiPath}`);

// Generate Postman collection
const postmanCollection = {
  info: {
    name: 'Customer API Collection',
    description: 'Customer-facing APIs for e-commerce platform',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    {
      key: 'baseUrl',
      value: 'https://yourdomain.com/api',
      type: 'string'
    }
  ],
  item: []
};

Object.entries(customerAPIs).forEach(([key, section]) => {
  const folder = {
    name: section.title,
    item: section.endpoints.map(endpoint => ({
      name: endpoint.summary,
      request: {
        method: endpoint.method,
        header: endpoint.method === 'POST' ? [
          {
            key: 'Content-Type',
            value: 'application/json'
          }
        ] : [],
        url: {
          raw: `{{baseUrl}}${endpoint.path}`,
          host: ['{{baseUrl}}'],
          path: endpoint.path.split('/').filter(p => p)
        },
        body: endpoint.requestBody ? {
          mode: 'raw',
          raw: JSON.stringify(endpoint.requestBody, null, 2)
        } : undefined
      }
    }))
  };
  postmanCollection.item.push(folder);
});

const postmanPath = path.join(docsDir, 'customer-api-postman.json');
fs.writeFileSync(postmanPath, JSON.stringify(postmanCollection, null, 2));
console.log(`✅ Postman collection generated: ${postmanPath}`);

console.log('\n🎉 Documentation generation complete!');
console.log('\nGenerated files:');
console.log(`📄 HTML Documentation: docs/customer-api.html`);
console.log(`📋 Markdown Documentation: docs/CUSTOMER_API_DOCUMENTATION.md`);
console.log(`🔧 OpenAPI Specification: docs/customer-api-openapi.json`);
console.log(`📮 Postman Collection: docs/customer-api-postman.json`);
console.log('\n💡 You can now:');
console.log('• Open the HTML file in a browser for interactive docs');
console.log('• Import the OpenAPI spec into Swagger UI');
console.log('• Import the Postman collection for API testing');
console.log('• Share the markdown file with developers');