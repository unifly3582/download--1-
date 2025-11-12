// Test date formatting for orders page
const testOrder = {
  orderId: "5020",
  createdAt: "2025-11-12T06:53:01.037Z",
  customerInfo: {
    name: "Test Customer"
  }
};

console.log('=== Date Format Testing ===');
console.log('Original createdAt:', testOrder.createdAt);

// Test the exact formatting used in the UI
const date = new Date(testOrder.createdAt);

const dateFormatted = date.toLocaleDateString('en-IN', {
  day: '2-digit',
  month: '2-digit', 
  year: 'numeric'
});

const timeFormatted = date.toLocaleTimeString('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
});

console.log('Formatted Date:', dateFormatted);
console.log('Formatted Time:', timeFormatted);

// Show what it would look like in the table
console.log('\n=== Table Display ===');
console.log(`Order ID: ${testOrder.orderId}`);
console.log(`Date: ${dateFormatted}`);
console.log(`Time: ${timeFormatted}`);
console.log(`Customer: ${testOrder.customerInfo.name}`);

// Test with current time
const now = new Date();
console.log('\n=== Current Time Test ===');
console.log('Current Date:', now.toLocaleDateString('en-IN', {
  day: '2-digit',
  month: '2-digit', 
  year: 'numeric'
}));
console.log('Current Time:', now.toLocaleTimeString('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
}));