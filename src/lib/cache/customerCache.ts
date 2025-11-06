// Local customer cache system
import fs from 'fs';
import path from 'path';
import { Customer } from '@/types/customers';

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');
const CUSTOMERS_CACHE_FILE = path.join(CACHE_DIR, 'customers.json');
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

interface CustomerCache {
  customers: Customer[];
  lastUpdated: number;
  phoneIndex: Record<string, Customer>;
  nameIndex: Record<string, Customer[]>;
}

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Load cache from file
function loadCache(): CustomerCache | null {
  try {
    ensureCacheDir();
    if (!fs.existsSync(CUSTOMERS_CACHE_FILE)) {
      return null;
    }
    
    const data = fs.readFileSync(CUSTOMERS_CACHE_FILE, 'utf8');
    const cache = JSON.parse(data) as CustomerCache;
    
    // Check if cache is expired
    if (Date.now() - cache.lastUpdated > CACHE_DURATION) {
      return null;
    }
    
    return cache;
  } catch (error) {
    console.error('[CACHE] Error loading customer cache:', error);
    return null;
  }
}

// Save cache to file
function saveCache(cache: CustomerCache) {
  try {
    ensureCacheDir();
    fs.writeFileSync(CUSTOMERS_CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('[CACHE] Error saving customer cache:', error);
  }
}

// Build indexes for fast searching
function buildIndexes(customers: Customer[]): { phoneIndex: Record<string, Customer>, nameIndex: Record<string, Customer[]> } {
  const phoneIndex: Record<string, Customer> = {};
  const nameIndex: Record<string, Customer[]> = {};
  
  customers.forEach(customer => {
    // Phone index
    phoneIndex[customer.phone] = customer;
    
    // Name index (for partial matching)
    const nameLower = customer.name.toLowerCase();
    const words = nameLower.split(' ');
    
    words.forEach(word => {
      if (!nameIndex[word]) {
        nameIndex[word] = [];
      }
      nameIndex[word].push(customer);
    });
  });
  
  return { phoneIndex, nameIndex };
}

// Update cache with fresh data
export function updateCustomerCache(customers: Customer[]) {
  const { phoneIndex, nameIndex } = buildIndexes(customers);
  
  const cache: CustomerCache = {
    customers,
    lastUpdated: Date.now(),
    phoneIndex,
    nameIndex
  };
  
  saveCache(cache);
  console.log(`[CACHE] Updated customer cache with ${customers.length} customers`);
}

// Update single customer in cache (for real-time updates)
export function updateSingleCustomerInCache(customer: Customer) {
  const cache = loadCache();
  if (!cache) {
    console.warn('[CACHE] No cache found, skipping single customer update');
    return;
  }
  
  // Update or add customer in the array
  const existingIndex = cache.customers.findIndex(c => c.phone === customer.phone);
  if (existingIndex >= 0) {
    cache.customers[existingIndex] = customer;
  } else {
    cache.customers.push(customer);
  }
  
  // Rebuild indexes
  const { phoneIndex, nameIndex } = buildIndexes(cache.customers);
  cache.phoneIndex = phoneIndex;
  cache.nameIndex = nameIndex;
  cache.lastUpdated = Date.now();
  
  saveCache(cache);
  console.log(`[CACHE] Updated single customer in cache: ${customer.phone}`);
}

// Search customers in cache
export function searchCustomersInCache(query: string): Customer[] | null {
  const cache = loadCache();
  if (!cache) {
    return null; // Cache miss or expired
  }
  
  const results: Customer[] = [];
  const queryLower = query.toLowerCase();
  
  // Phone search (exact match)
  const cleanedQuery = query.replace(/\D/g, '');
  if (cleanedQuery.length === 10 || (cleanedQuery.length === 12 && cleanedQuery.startsWith('91'))) {
    const formattedPhone = query.startsWith('+91') ? query : `+91${cleanedQuery.slice(-10)}`;
    const customer = cache.phoneIndex[formattedPhone];
    if (customer) {
      results.push(customer);
    }
  } else {
    // Enhanced name/email/customerId search
    const matchedCustomers = new Set<Customer>();
    
    // Method 1: Word-based matching (existing approach)
    const words = queryLower.split(' ').filter(word => word.length > 0);
    words.forEach(word => {
      Object.keys(cache.nameIndex).forEach(indexedWord => {
        if (indexedWord.includes(word)) {
          cache.nameIndex[indexedWord].forEach(customer => {
            matchedCustomers.add(customer);
          });
        }
      });
    });
    
    // Method 2: Direct string matching (for cases where word indexing fails)
    cache.customers.forEach(customer => {
      const nameMatch = customer.name.toLowerCase().includes(queryLower);
      const emailMatch = customer.email && customer.email.toLowerCase().includes(queryLower);
      const customerIdMatch = customer.customerId && customer.customerId.toLowerCase().includes(queryLower);
      
      if (nameMatch || emailMatch || customerIdMatch) {
        matchedCustomers.add(customer);
      }
    });
    
    results.push(...Array.from(matchedCustomers).slice(0, 20));
  }
  
  return results;
}

// Get cache stats
export function getCacheStats() {
  const cache = loadCache();
  if (!cache) {
    return { cached: false, count: 0, lastUpdated: null };
  }
  
  return {
    cached: true,
    count: cache.customers.length,
    lastUpdated: new Date(cache.lastUpdated).toISOString(),
    isExpired: Date.now() - cache.lastUpdated > CACHE_DURATION
  };
}