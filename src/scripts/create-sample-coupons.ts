/**
 * Script to create sample coupons for testing
 * Run with: npx tsx src/scripts/create-sample-coupons.ts
 */

import { db } from '../lib/firebase/server';

const sampleCoupons = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    usageType: 'multi_use',
    maxUsageCount: 100,
    applicableUsers: 'new_users_only',
    minimumOrderValue: 500,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    description: '10% off for new customers on orders above ₹500',
    isActive: true,
    currentUsageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },
  {
    code: 'SAVE20',
    type: 'percentage',
    value: 20,
    usageType: 'multi_use',
    maxUsageCount: 50,
    applicableUsers: 'all',
    minimumOrderValue: 1000,
    maximumDiscountAmount: 200,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days
    description: '20% off on orders above ₹1000 (max ₹200 discount)',
    isActive: true,
    currentUsageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },
  {
    code: 'FLAT100',
    type: 'fixed_amount',
    value: 100,
    usageType: 'multi_use',
    maxUsageCount: 200,
    applicableUsers: 'all',
    minimumOrderValue: 800,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days
    description: '₹100 off on orders above ₹800',
    isActive: true,
    currentUsageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },
  {
    code: 'FREESHIP',
    type: 'free_shipping',
    value: 0,
    usageType: 'multi_use',
    applicableUsers: 'all',
    minimumOrderValue: 300,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
    description: 'Free shipping on orders above ₹300',
    isActive: true,
    currentUsageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },
  {
    code: 'EXPIRED10',
    type: 'percentage',
    value: 10,
    usageType: 'single_use',
    applicableUsers: 'all',
    minimumOrderValue: 500,
    validFrom: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (expired)
    description: 'Expired coupon for testing',
    isActive: true,
    currentUsageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  }
];

async function createSampleCoupons() {
  console.log('Creating sample coupons...');
  
  try {
    const batch = db.batch();
    
    for (const coupon of sampleCoupons) {
      // Check if coupon already exists
      const existingCoupon = await db.collection('coupons')
        .where('code', '==', coupon.code)
        .get();
      
      if (existingCoupon.empty) {
        const couponRef = db.collection('coupons').doc();
        batch.set(couponRef, {
          ...coupon,
          couponId: couponRef.id
        });
        console.log(`✓ Added coupon: ${coupon.code}`);
      } else {
        console.log(`- Coupon ${coupon.code} already exists, skipping`);
      }
    }
    
    await batch.commit();
    console.log('\n✅ Sample coupons created successfully!');
    console.log('\nYou can now test the coupon system with these codes:');
    sampleCoupons.forEach(coupon => {
      console.log(`- ${coupon.code}: ${coupon.description}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating sample coupons:', error);
  }
}

// Run the script
createSampleCoupons().then(() => {
  console.log('\nScript completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});