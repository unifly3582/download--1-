/**
 * Check order 5332 details
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function checkOrder() {
  const orderId = '5332';
  
  console.log('🔍 Checking Order:', orderId);
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Get order
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      console.log('❌ Order not found!');
      return;
    }
    
    const order = orderDoc.data();
    
    // Basic Info
    console.log('📦 ORDER DETAILS');
    console.log('-'.repeat(60));
    console.log('Order ID:', order.orderId);
    console.log('Order Source:', order.orderSource || 'N/A');
    console.log('Created At:', order.createdAt?.toDate?.() || 'N/A');
    console.log('');
    
    // Customer Info
    console.log('👤 CUSTOMER INFO');
    console.log('-'.repeat(60));
    console.log('Customer ID:', order.customerInfo?.customerId || 'N/A');
    console.log('Name:', order.customerInfo?.name || 'N/A');
    console.log('Phone:', order.customerInfo?.phone || 'N/A');
    console.log('Email:', order.customerInfo?.email || 'N/A');
    console.log('');
    
    // Shipping Address
    console.log('📍 SHIPPING ADDRESS');
    console.log('-'.repeat(60));
    if (order.shippingAddress) {
      console.log('Street:', order.shippingAddress.street || 'N/A');
      console.log('City:', order.shippingAddress.city || 'N/A');
      console.log('State:', order.shippingAddress.state || 'N/A');
      console.log('ZIP:', order.shippingAddress.zip || 'N/A');
      console.log('Country:', order.shippingAddress.country || 'N/A');
    } else {
      console.log('No shipping address');
    }
    console.log('');
    
    // Items
    console.log('🛒 ORDER ITEMS');
    console.log('-'.repeat(60));
    if (order.items && order.items.length > 0) {
      order.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.productName || 'N/A'}`);
        console.log(`   SKU: ${item.sku || 'N/A'}`);
        console.log(`   Quantity: ${item.quantity || 0}`);
        console.log(`   Unit Price: ₹${item.unitPrice || 0}`);
        console.log(`   Total: ₹${(item.quantity * item.unitPrice) || 0}`);
        console.log('');
      });
    } else {
      console.log('No items');
    }
    
    // Pricing
    console.log('💰 PRICING');
    console.log('-'.repeat(60));
    const pricing = order.pricingInfo || {};
    console.log('Subtotal:', '₹' + (pricing.subtotal || 0));
    console.log('Discount:', '₹' + (pricing.discount || 0));
    console.log('Taxes:', '₹' + (pricing.taxes || 0));
    console.log('Shipping:', '₹' + (pricing.shippingCharges || 0));
    console.log('COD Charges:', '₹' + (pricing.codCharges || 0));
    console.log('Prepaid Discount:', '₹' + (pricing.prepaidDiscount || 0));
    console.log('Grand Total:', '₹' + (pricing.grandTotal || 0));
    console.log('');
    
    // Payment
    console.log('💳 PAYMENT');
    console.log('-'.repeat(60));
    console.log('Method:', order.paymentInfo?.method || 'N/A');
    console.log('Status:', order.paymentInfo?.status || 'N/A');
    if (order.paymentInfo?.razorpayOrderId) {
      console.log('Razorpay Order ID:', order.paymentInfo.razorpayOrderId);
    }
    if (order.paymentInfo?.razorpayPaymentId) {
      console.log('Razorpay Payment ID:', order.paymentInfo.razorpayPaymentId);
    }
    console.log('');
    
    // Status
    console.log('📊 STATUS');
    console.log('-'.repeat(60));
    console.log('Internal Status:', order.internalStatus || 'N/A');
    console.log('Customer Facing Status:', order.customerFacingStatus || 'N/A');
    console.log('Approval Status:', order.approval?.status || 'N/A');
    console.log('');
    
    // Shipment
    console.log('🚚 SHIPMENT');
    console.log('-'.repeat(60));
    console.log('AWB Number:', order.shipmentInfo?.awbNumber || 'Not shipped');
    console.log('Courier:', order.shipmentInfo?.courierPartner || 'N/A');
    console.log('Tracking Status:', order.shipmentInfo?.trackingStatus || 'N/A');
    console.log('Weight:', order.weight || 'N/A');
    if (order.dimensions) {
      console.log('Dimensions:', `${order.dimensions.length}x${order.dimensions.width}x${order.dimensions.height} cm`);
    }
    console.log('');
    
    // Coupon
    if (order.couponCode) {
      console.log('🎟️ COUPON');
      console.log('-'.repeat(60));
      console.log('Coupon Code:', order.couponCode);
      if (order.couponDetails) {
        console.log('Discount Amount:', '₹' + order.couponDetails.discountAmount);
        console.log('Coupon Type:', order.couponDetails.couponType);
      }
      console.log('');
    }
    
    // Traffic Source
    if (order.trafficSource) {
      console.log('📈 TRAFFIC SOURCE');
      console.log('-'.repeat(60));
      console.log('Source:', order.trafficSource);
      console.log('');
    }
    
    // Check customer profile
    const customerPhone = order.customerInfo?.phone;
    if (customerPhone) {
      console.log('👤 CUSTOMER PROFILE');
      console.log('-'.repeat(60));
      
      // Try to find customer
      const customersSnapshot = await db.collection('customers')
        .where('phone', '==', customerPhone)
        .limit(1)
        .get();
      
      if (!customersSnapshot.empty) {
        const customerDoc = customersSnapshot.docs[0];
        const customer = customerDoc.data();
        
        console.log('Customer ID:', customerDoc.id);
        console.log('Name:', customer.name || 'N/A');
        console.log('Email:', customer.email || 'N/A');
        console.log('Total Orders:', customer.totalOrders || 0);
        console.log('Total Spent:', '₹' + (customer.totalSpent || 0));
        console.log('Loyalty Tier:', customer.loyaltyTier || 'N/A');
        console.log('Trust Score:', customer.trustScore || 'N/A');
        
        if (customer.defaultAddress) {
          console.log('');
          console.log('Default Address:');
          console.log('  ', customer.defaultAddress.street || 'N/A');
          console.log('  ', `${customer.defaultAddress.city}, ${customer.defaultAddress.state} ${customer.defaultAddress.zip}`);
        }
        
        if (customer.savedAddresses && customer.savedAddresses.length > 0) {
          console.log('');
          console.log('Saved Addresses:', customer.savedAddresses.length);
        }
      } else {
        console.log('❌ Customer profile not found');
      }
      console.log('');
    }
    
    // Full JSON
    console.log('📄 FULL ORDER DATA (JSON)');
    console.log('-'.repeat(60));
    console.log(JSON.stringify(order, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkOrder()
  .then(() => {
    console.log('');
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
