import type { Order } from '@/types/order';
import type { Customer } from '@/types/customers';
import type { Product } from '@/types/products';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const productImages = PlaceHolderImages.filter(img => img.id.startsWith('product-'));

export const products: Product[] = [
  {
    id: 'PROD001',
    name: 'Organic Vegetable Box',
    category: 'Vegetables',
    variations: [
      {
        id: 'VAR001',
        name: 'Standard Box',
        sku: 'OVB-STD',
        price: 25.00,
        stock: 150,
        attributes: { size: 'Standard' },
        weight: 1000,
        dimensions: { l: 30, b: 20, h: 15 }
      }
    ],
    media: [{ type: 'image', url: productImages.find(p=>p.id==='product-vegetables')?.imageUrl || '' }]
  },
  {
    id: 'PROD002',
    name: 'Assorted Fruit Crate',
    category: 'Fruits',
    variations: [
      {
        id: 'VAR002',
        name: 'Medium Crate',
        sku: 'AFC-MED',
        price: 30.00,
        stock: 200,
        attributes: { size: 'Medium' },
        weight: 1500,
        dimensions: { l: 35, b: 25, h: 20 }
      }
    ],
    media: [{ type: 'image', url: productImages.find(p=>p.id==='product-fruits')?.imageUrl || '' }]
  },
  {
    id: 'PROD003',
    name: 'Artisanal Cheese Selection',
    category: 'Dairy',
    variations: [
      {
        id: 'VAR003',
        name: 'Gourmet Selection',
        sku: 'ACS-GOURMET',
        price: 45.00,
        stock: 80,
        attributes: { type: 'Gourmet' },
        weight: 800,
        dimensions: { l: 25, b: 20, h: 10 }
      }
    ],
    media: [{ type: 'image', url: productImages.find(p=>p.id==='product-dairy')?.imageUrl || '' }]
  },
  {
    id: 'PROD004',
    name: 'Sourdough Loaf',
    category: 'Bakery',
    variations: [
      {
        id: 'VAR004',
        name: 'Classic Loaf',
        sku: 'SL-CLASSIC',
        price: 8.50,
        stock: 120,
        attributes: { type: 'Classic' },
        weight: 500,
        dimensions: { l: 30, b: 15, h: 10 }
      }
    ],
    media: [{ type: 'image', url: productImages.find(p=>p.id==='product-bread')?.imageUrl || '' }]
  },
  {
    id: 'PROD005',
    name: 'Wildflower Honey',
    category: 'Pantry',
    variations: [
      {
        id: 'VAR005',
        name: '500g Jar',
        sku: 'WH-500G',
        price: 15.75,
        stock: 300,
        attributes: { size: '500g' },
        weight: 600,
        dimensions: { l: 10, b: 10, h: 15 }
      }
    ],
    media: [{ type: 'image', url: productImages.find(p=>p.id==='product-honey')?.imageUrl || '' }]
  },
];

// Legacy data exports - kept for backward compatibility but should not be used
// Use API endpoints instead for real-time data
export const customers: Customer[] = [];
export const orders: Order[] = [];
