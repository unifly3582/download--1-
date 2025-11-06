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
        attributes: { size: 'Standard' }
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
        attributes: { size: 'Medium' }
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
        attributes: { type: 'Gourmet' }
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
        attributes: { type: 'Classic' }
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
        attributes: { size: '500g' }
      }
    ],
    media: [{ type: 'image', url: productImages.find(p=>p.id==='product-honey')?.imageUrl || '' }]
  },
];

export const customers: Customer[] = [
  { customerId: 'CUST001', name: 'Alice Johnson', email: 'alice@example.com', totalSpent: 1500, createdAt: '2023-01-15', updatedAt: '2023-01-15', purchaseHistory: ['ORD001', 'ORD005'], phone: '123-456-7890', isDubious: false, whatsappOptIn: false, trustScore: 90, loyaltyTier: 'gold', totalOrders: 2, avgOrderValue: 750, refundsCount: 0, returnRate: 0, lifetimeValue: 1500 },
  { customerId: 'CUST002', name: 'Bob Smith', email: 'bob@example.com', totalSpent: 850, createdAt: '2023-02-20', updatedAt: '2023-02-20', purchaseHistory: ['ORD002'], phone: '123-456-7890', isDubious: false, whatsappOptIn: true, trustScore: 75, loyaltyTier: 'repeat', totalOrders: 1, avgOrderValue: 850, refundsCount: 0, returnRate: 0, lifetimeValue: 850 },
  { customerId: 'CUST003', name: 'Charlie Brown', email: 'charlie@example.com', totalSpent: 2300, createdAt: '2022-11-30', updatedAt: '2022-11-30', purchaseHistory: ['ORD003', 'ORD004', 'ORD006'], phone: '123-456-7890', isDubious: false, whatsappOptIn: false, trustScore: 95, loyaltyTier: 'platinum', totalOrders: 3, avgOrderValue: 766.67, refundsCount: 0, returnRate: 0, lifetimeValue: 2300 },
  { customerId: 'CUST004', name: 'Diana Prince', email: 'diana@example.com', totalSpent: 450, createdAt: '2023-03-10', updatedAt: '2023-03-10', purchaseHistory: [], phone: '123-456-7890', isDubious: false, whatsappOptIn: false, trustScore: 60, loyaltyTier: 'new', totalOrders: 0, avgOrderValue: 0, refundsCount: 0, returnRate: 0, lifetimeValue: 450 },
  { customerId: 'CUST005', name: 'Ethan Hunt', email: 'ethan@example.com', totalSpent: 3200, createdAt: '2021-09-01', updatedAt: '2021-09-01', purchaseHistory: [], phone: '123-456-7890', isDubious: false, whatsappOptIn: true, trustScore: 88, loyaltyTier: 'platinum', totalOrders: 0, avgOrderValue: 0, refundsCount: 1, returnRate: 0.05, lifetimeValue: 3200 },
  { customerId: 'CUST006', name: 'Admin', email: 'admin@bugglyfarms.com', totalSpent: 0, createdAt: '2024-01-01', updatedAt: '2024-01-01', purchaseHistory: [], phone: '123-456-7890', isDubious: false, whatsappOptIn: false, trustScore: 100, loyaltyTier: 'new', totalOrders: 0, avgOrderValue: 0, refundsCount: 0, returnRate: 0, lifetimeValue: 0 },
];

export const orders: Order[] = [];

export const salesData = [
    { month: 'Jan', sales: 4000 },
    { month: 'Feb', sales: 3000 },
    { month: 'Mar', sales: 5000 },
    { month: 'Apr', sales: 4500 },
    { month: 'May', sales: 6000 },
    { month: 'Jun', sales: 5500 },
];

export const topProductsData = [
  { name: 'Veggie Box', value: 400 },
  { name: 'Fruit Crate', value: 300 },
  { name: 'Cheese', value: 200 },
  { name: 'Bread', value: 278 },
  { name: 'Honey', value: 189 },
];
