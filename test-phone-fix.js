// Test phone number formatting fix
const testCases = [
  '6005270078',      // 10 digits
  '+916005270078',   // Full format
  '916005270078',    // With country code
  '91 6005270078',   // With space
  '+91-6005270078',  // With dash
];

testCases.forEach(search => {
  const cleanedSearch = search.replace(/\D/g, '');
  const isValid = cleanedSearch.length === 10 || (cleanedSearch.length === 12 && cleanedSearch.startsWith('91'));
  const formattedPhone = search.startsWith('+91') ? search : `+91${cleanedSearch.slice(-10)}`;
  
  console.log(`Input: "${search}"`);
  console.log(`  Cleaned: "${cleanedSearch}" (length: ${cleanedSearch.length})`);
  console.log(`  Valid: ${isValid}`);
  console.log(`  Formatted: "${formattedPhone}"`);
  console.log('');
});