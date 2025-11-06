// SQLite local database for customer data
import Database from 'better-sqlite3';
import path from 'path';
import { Customer } from '@/types/customers';

const DB_PATH = path.join(process.cwd(), 'data', 'customers.db');
let db: Database.Database | null = null;

// Initialize SQLite database
function initDB() {
  if (db) return db;
  
  try {
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    db = new Database(DB_PATH);
    
    // Create customers table
    db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        phone TEXT PRIMARY KEY,
        customerId TEXT,
        name TEXT,
        email TEXT,
        trustScore INTEGER,
        loyaltyTier TEXT,
        totalOrders INTEGER,
        totalSpent REAL,
        defaultAddress TEXT,
        savedAddresses TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        lastSyncAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for fast searching
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      CREATE INDEX IF NOT EXISTS idx_customers_customerId ON customers(customerId);
    `);
    
    console.log('[SQLITE] Database initialized successfully');
    return db;
  } catch (error) {
    console.error('[SQLITE] Error initializing database:', error);
    return null;
  }
}

// Sync customer from Firestore to SQLite
export function syncCustomerToLocal(customer: Customer) {
  const database = initDB();
  if (!database) return;
  
  try {
    const stmt = database.prepare(`
      INSERT OR REPLACE INTO customers (
        phone, customerId, name, email, trustScore, loyaltyTier,
        totalOrders, totalSpent, defaultAddress, savedAddresses,
        createdAt, updatedAt, lastSyncAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      customer.phone,
      customer.customerId,
      customer.name,
      customer.email || null,
      customer.trustScore,
      customer.loyaltyTier,
      customer.totalOrders,
      customer.totalSpent,
      JSON.stringify(customer.defaultAddress || null),
      JSON.stringify(customer.savedAddresses || []),
      customer.createdAt,
      customer.updatedAt
    );
    
    console.log(`[SQLITE] Synced customer ${customer.phone} to local DB`);
  } catch (error) {
    console.error('[SQLITE] Error syncing customer:', error);
  }
}

// Search customers in local SQLite
export function searchCustomersLocal(query: string, limit: number = 20): Customer[] {
  const database = initDB();
  if (!database) return [];
  
  try {
    let stmt;
    let results;
    
    // Phone search
    if (/^\+?91?\d{10}$/.test(query.replace(/\D/g, ''))) {
      const formattedPhone = query.startsWith('+91') ? query : `+91${query.replace(/\D/g, '').slice(-10)}`;
      stmt = database.prepare('SELECT * FROM customers WHERE phone = ?');
      results = stmt.all(formattedPhone);
    } else {
      // Name or email search
      stmt = database.prepare(`
        SELECT * FROM customers 
        WHERE name LIKE ? OR email LIKE ? 
        ORDER BY totalOrders DESC, lastSyncAt DESC 
        LIMIT ?
      `);
      const searchPattern = `%${query}%`;
      results = stmt.all(searchPattern, searchPattern, limit);
    }
    
    // Convert back to Customer objects
    return results.map((row: any) => ({
      ...row,
      defaultAddress: row.defaultAddress ? JSON.parse(row.defaultAddress) : undefined,
      savedAddresses: row.savedAddresses ? JSON.parse(row.savedAddresses) : []
    }));
    
  } catch (error) {
    console.error('[SQLITE] Error searching customers:', error);
    return [];
  }
}

// Get local database stats
export function getLocalDBStats() {
  const database = initDB();
  if (!database) return { count: 0, lastSync: null };
  
  try {
    const countStmt = database.prepare('SELECT COUNT(*) as count FROM customers');
    const lastSyncStmt = database.prepare('SELECT MAX(lastSyncAt) as lastSync FROM customers');
    
    const { count } = countStmt.get() as { count: number };
    const { lastSync } = lastSyncStmt.get() as { lastSync: string };
    
    return { count, lastSync };
  } catch (error) {
    console.error('[SQLITE] Error getting stats:', error);
    return { count: 0, lastSync: null };
  }
}

// Bulk sync customers from Firestore
export function bulkSyncCustomers(customers: Customer[]) {
  const database = initDB();
  if (!database) return;
  
  try {
    const stmt = database.prepare(`
      INSERT OR REPLACE INTO customers (
        phone, customerId, name, email, trustScore, loyaltyTier,
        totalOrders, totalSpent, defaultAddress, savedAddresses,
        createdAt, updatedAt, lastSyncAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const transaction = database.transaction((customers: Customer[]) => {
      for (const customer of customers) {
        stmt.run(
          customer.phone,
          customer.customerId,
          customer.name,
          customer.email || null,
          customer.trustScore,
          customer.loyaltyTier,
          customer.totalOrders,
          customer.totalSpent,
          JSON.stringify(customer.defaultAddress || null),
          JSON.stringify(customer.savedAddresses || []),
          customer.createdAt,
          customer.updatedAt
        );
      }
    });
    
    transaction(customers);
    console.log(`[SQLITE] Bulk synced ${customers.length} customers`);
  } catch (error) {
    console.error('[SQLITE] Error bulk syncing customers:', error);
  }
}