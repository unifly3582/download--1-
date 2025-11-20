/**
 * Delete Demo Testimonials
 * This script helps you remove the hardcoded demo data (IDs: 1-6)
 * so your real testimonials can show
 */

console.log('⚠️  DEMO DATA REMOVAL SCRIPT\n');
console.log('='.repeat(80));
console.log('\nThis script will help you remove the demo testimonials (IDs: 1-6)');
console.log('so your real testimonials (Ankit Hemraj, Nilesh, etc.) can show.\n');
console.log('='.repeat(80));
console.log('\n📋 MANUAL STEPS TO DELETE DEMO DATA:\n');
console.log('1. Go to Firebase Console:');
console.log('   https://console.firebase.google.com\n');
console.log('2. Select your project\n');
console.log('3. Click "Firestore Database" in the left menu\n');
console.log('4. Find the "testimonials" collection\n');
console.log('5. Delete these 6 demo documents:\n');
console.log('   ❌ Document ID: "1" (राजेश कुमार)');
console.log('   ❌ Document ID: "2" (ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ)');
console.log('   ❌ Document ID: "3" (Mohammed Salim)');
console.log('   ❌ Document ID: "4" (వెంకట రావు)');
console.log('   ❌ Document ID: "5" (Suresh Patel)');
console.log('   ❌ Document ID: "6" (अमित शर्मा)\n');
console.log('6. Click the three dots (...) next to each document\n');
console.log('7. Select "Delete document"\n');
console.log('8. Confirm deletion\n');
console.log('='.repeat(80));
console.log('\n✅ AFTER DELETION:\n');
console.log('Run this command to verify your real testimonials appear:');
console.log('   node check-database-via-api.js\n');
console.log('You should see:');
console.log('   - Ankit Hemraj (Chandrapur, Maharashtra)');
console.log('   - Nilesh (Nagpur, Maharashtra)');
console.log('   - Ankit Mittal (Patiala, Punjab)');
console.log('   - Farman Ali (shamli, Uttar pradesh)\n');
console.log('='.repeat(80));
console.log('\n💡 ALTERNATIVE: Deactivate Instead of Delete\n');
console.log('If you want to keep the demo data but hide it:\n');
console.log('1. Go to your dashboard: http://localhost:3000/testimonials\n');
console.log('2. Find each demo testimonial\n');
console.log('3. Click the three dots (...) menu\n');
console.log('4. Click "Edit"\n');
console.log('5. Toggle "Active" to OFF (gray)\n');
console.log('6. Click "Save"\n');
console.log('='.repeat(80));
console.log('\n🔧 WHY THIS HAPPENED:\n');
console.log('The demo data (IDs: 1-6) was manually created in Firestore,');
console.log('probably for testing. These have isActive=true and low displayOrder');
console.log('values (0-5), so they appear before your real testimonials.\n');
console.log('Your real testimonials likely have higher displayOrder values (0, 1, 2, 4)');
console.log('but the demo data is taking priority.\n');
console.log('='.repeat(80));
