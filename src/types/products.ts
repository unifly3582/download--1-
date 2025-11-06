
import {Timestamp} from 'firebase/firestore';

export type Media = {
  type: 'image' | 'video';
  url: string;
};

// Represents a specific variant of a product (e.g., "T-Shirt, Blue, Large")
export type ProductVariation = {
  id: string; // Unique ID for the variation
  name: string; // e.g., "Large" or "Blue" or "Large / Blue"
  sku: string; // Stock Keeping Unit
  hsnCode?: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  attributes: {[key: string]: string}; // e.g., { "color": "Blue", "size": "Large" }
  weight: number; // in grams
  dimensions: { l: number; b: number; h: number; }; // in cm
};

// Represents the parent product that groups variations
export type Product = {
  id: string;
  name: string; // e.g., "Classic T-Shirt"
  slug?: string; // Add slug property
  description?: string;
  category: string;
  media?: Media[];
  isActive?: boolean;
  isFeatured?: boolean;
  isCodAvailable?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  // Variations are now a core part of the product
  variations: ProductVariation[];
};
