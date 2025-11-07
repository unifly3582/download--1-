// SQLite local database for customer data
// This file is currently disabled as better-sqlite3 is not installed
// Uncomment and install better-sqlite3 if you want to use local SQLite caching

/*
import Database from 'better-sqlite3';
import path from 'path';
import { Customer } from '@/types/customers';

const DB_PATH = path.join(process.cwd(), 'data', 'customers.db');
let db: Database.Database | null = null;

// ... rest of the implementation
*/

export function syncCustomerToLocal(customer: any) {
  // Disabled
}

export function searchCustomersLocal(query: string, limit: number = 20): any[] {
  return [];
}

export function getLocalDBStats() {
  return { count: 0, lastSync: null };
}

export function bulkSyncCustomers(customers: any[]) {
  // Disabled
}
