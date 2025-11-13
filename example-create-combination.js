// Example: Creating a combination via API call

const createCombination = async () => {
  const response = await fetch('/api/combinations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-admin-token'
    },
    body: JSON.stringify({
      items: [
        {
          productId: 'PROD001',
          productName: 'Product A',
          sku: 'SKU001',
          quantity: 2,
          unitPrice: 100
        },
        {
          productId: 'PROD002', 
          productName: 'Product B',
          sku: 'SKU002',
          quantity: 1,
          unitPrice: 200
        }
      ],
      weight: 3.5,  // Manually verified total weight
      dimensions: { 
        l: 25,  // Length in cm
        b: 20,  // Breadth in cm  
        h: 15   // Height in cm
      },
      notes: 'Manually verified - packed together efficiently'
    })
  });

  const result = await response.json();
  console.log('Combination created:', result);
};