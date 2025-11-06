// scripts/import-csv-orders.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// --- CONFIGURATION ---
const DRY_RUN = false;
const BATCH_SIZE = 400;

/**
 * Initializes the Firebase Admin SDK using environment variables.
 */
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.app();

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set. Ensure .env.local is being loaded.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    })
  });
  console.log('Firebase Admin SDK Initialized.');
}

function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

const customerCache = new Map();
async function findCustomerByPhone(db, phone) {
  if (!phone) return null;
  const fullPhoneNumber = `+91${phone.replace(/[^0-9]/g, '').slice(-10)}`;
  
  if (customerCache.has(fullPhoneNumber)) {
    return customerCache.get(fullPhoneNumber);
  }
  
  const querySnapshot = await db.collection('customers').where('phone', '==', fullPhoneNumber).limit(1).get();
  
  if (querySnapshot.empty) {
    customerCache.set(fullPhoneNumber, null);
    return null;
  }

  const customerDoc = querySnapshot.docs[0];
  const customerData = customerDoc.data();
  const customerWithId = { ...customerData, id: customerDoc.id };
  customerCache.set(fullPhoneNumber, customerWithId);
  return customerWithId;
}

function parseOrderDate(dateString) {
    if (!dateString) return null;
    try {
        // Attempt to parse the date
        const date = new Date(dateString);
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return null;
        }
        return admin.firestore.Timestamp.fromDate(date);
    } catch (error) {
        return null;
    }
}

async function main() {
  console.log(`Starting CSV order import. DRY_RUN is set to: ${DRY_RUN}`);
  
  initializeFirebaseAdmin();
  const db = admin.firestore();
  const allOrderRows = await readCsv(path.join(__dirname, 'orders.csv'));

  const ordersMap = allOrderRows.reduce((acc, row) => {
    if (row.order_id) {
      if (!acc[row.order_id]) acc[row.order_id] = [];
      acc[row.order_id].push(row);
    }
    return acc;
  }, {});
  
  const ordersToProcess = Object.values(ordersMap);
  console.log(`Found ${ordersToProcess.length} unique orders to process from the CSV.`);

  let batch = db.batch();
  let writeCount = 0;
  let skippedCount = 0;
  let successCount = 0;

  for (let i = 0; i < ordersToProcess.length; i++) {
    const orderRows = ordersToProcess[i];
    const firstRow = orderRows[0];
    
    if (!firstRow.order_id || !firstRow.customer_phone) {
      console.warn(`- SKIPPING order row ${i + 2}: Missing order_id or customer_phone.`);
      skippedCount++;
      continue;
    }

    const customer = await findCustomerByPhone(db, firstRow.customer_phone);
    if (!customer) {
      console.warn(`- SKIPPING order ${firstRow.order_id}: Could not find existing customer with phone ${firstRow.customer_phone}.`);
      skippedCount++;
      continue;
    }

    const createdAt = parseOrderDate(firstRow.order_date);
    if (!createdAt) {
        console.warn(`- SKIPPING order ${firstRow.order_id}: Invalid date format for order_date: ${firstRow.order_date}.`);
        skippedCount++;
        continue;
    }

    const newOrderId = `ORD_CSV_${firstRow.order_id.replace(/\//g, '-')}`;
    const orderRef = db.collection('orders').doc(newOrderId);
    
    const items = orderRows.map(row => ({
      productName: row.product_name || 'Legacy Product',
      sku: row.product_sku || 'LEGACY-SKU',
      quantity: parseInt(row.quantity, 10) || 1,
      unitPrice: parseFloat(row.unit_price) || 0,
      productId: 'LEGACY_PRODUCT',
    }));

    const grandTotal = parseFloat(firstRow.grand_total) || 0;
    
    const newOrderData = {
      orderId: newOrderId,
      orderSource: 'admin_form',
      customerInfo: { 
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
      },
      shippingAddress: customer.defaultAddress || { street: '', city: '', state: '', zip: '', country: 'India' },
      items: items,
      pricingInfo: { subtotal: grandTotal, grandTotal, shippingCharges: 0, codCharges: 0, taxes: 0 },
      paymentInfo: { method: firstRow.payment_method === 'COD' ? 'COD' : 'Prepaid', status: 'Completed' },
      approval: { status: 'approved' },
      internalStatus: 'delivered',
      createdAt: createdAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      needsManualWeightAndDimensions: true,
      shipmentInfo: {},
    };

    batch.set(orderRef, newOrderData);
    writeCount++;

    if (writeCount === BATCH_SIZE || i === ordersToProcess.length - 1) {
      if (DRY_RUN) {
        console.log(`\n[DRY RUN] Would commit a batch of ${writeCount} orders.\n`);
      } else {
        console.log(`\nCommitting a batch of ${writeCount} orders...\n`);
        await batch.commit();
      }
      successCount += writeCount;
      batch = db.batch();
      writeCount = 0;
    }
  }

  console.log('\n--------------------');
  console.log('Script finished!');
  console.log(`- Orders Successfully Processed: ${successCount}`);
  console.log(`- Orders Skipped: ${skippedCount}`);
  console.log('--------------------');
}


main().catch(error => {
  console.error('A critical error occurred:', error);
  process.exit(1);
});
