import { db } from '@/lib/firebase/server';

export interface CheckoutSettings {
  codCharges: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  prepaidDiscount: {
    type: 'fixed' | 'percentage';
    value: number;
  };
}

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOCUMENT = 'checkout';

// Cache for checkout settings (1 minute TTL)
let cachedSettings: CheckoutSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Fetch checkout settings from Firestore with caching
 */
export async function getCheckoutSettings(): Promise<CheckoutSettings> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedSettings;
  }
  
  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOCUMENT);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      // Return default settings
      const defaultSettings: CheckoutSettings = {
        codCharges: { type: 'fixed', value: 25 },
        prepaidDiscount: { type: 'fixed', value: 0 }
      };
      cachedSettings = defaultSettings;
      cacheTimestamp = now;
      return defaultSettings;
    }
    
    const settings = doc.data() as CheckoutSettings;
    cachedSettings = settings;
    cacheTimestamp = now;
    return settings;
  } catch (error) {
    console.error('[CHECKOUT_SETTINGS] Error fetching settings:', error);
    // Return default settings on error
    return {
      codCharges: { type: 'fixed', value: 25 },
      prepaidDiscount: { type: 'fixed', value: 0 }
    };
  }
}

/**
 * Calculate COD charges based on settings
 */
export function calculateCodCharges(subtotal: number, settings: CheckoutSettings): number {
  if (settings.codCharges.type === 'fixed') {
    return settings.codCharges.value;
  } else {
    return Math.round((subtotal * settings.codCharges.value) / 100);
  }
}

/**
 * Calculate prepaid discount based on settings
 */
export function calculatePrepaidDiscount(subtotal: number, settings: CheckoutSettings): number {
  if (settings.prepaidDiscount.type === 'fixed') {
    return settings.prepaidDiscount.value;
  } else {
    return Math.round((subtotal * settings.prepaidDiscount.value) / 100);
  }
}
