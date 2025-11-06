# 📚 System Documentation

## 🏗️ Architecture Overview

This e-commerce system is built with Next.js and follows a clear API separation pattern:

- **Customer APIs** (`/api/customer/*`) - Public endpoints for customer interactions
- **Admin APIs** (`/api/admin/*`) - Authenticated endpoints for business management
- **Core APIs** (`/api/orders`, `/api/customers`) - Main business logic endpoints

## 📖 Documentation Structure

- [API Usage Matrix](./api-usage-matrix.md) - Who uses what API
- [System Architecture](./architecture/system-overview.md) - High-level system design
- [API Documentation](./apis/) - Detailed API specifications
- [Component Dependencies](./components/) - Frontend component relationships

## 🔄 Auto-Generated Documentation

This documentation is automatically updated using:
- API usage scanning scripts
- Dependency analysis tools
- Automated diagram generation

Last updated: $(date)