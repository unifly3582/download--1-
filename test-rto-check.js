// Test script to check RTO orders via API

const fetch = require('node-fetch');

async function checkRTO() {
  console.log('🔍 Checking for RTO orders via API...\n');
  
  try {
    // You'll need to get a token first
    console.log('Note: This requires authentication.');
    console.log('Please run this from your browser console or use the dashboard.\n');
    console.log('Or manually check Firestore for:');
    console.log('  - internalStatus = "return_initiated"');
    console.log('  - internalStatus = "returned"');
    console.log('  - shipmentInfo.currentTrackingStatus contains "RTO"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRTO();
