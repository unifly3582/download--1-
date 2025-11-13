/**
 * COMBINATION STORAGE GUIDE
 * ========================
 * 
 * Location: Firestore Database > verifiedCombinations collection
 * Access: Firebase Console or programmatically via APIs
 */

// FIRESTORE COLLECTION STRUCTURE:
// verifiedCombinations/
//   {combinationHash}/          <- Document ID (MD5 hash)
//     combinationHash: string   <- e.g., "639c673772c6efffa6ff80b21a67d6f5"
//     items: array              <- Array of OrderItem objects
//     weight: number            <- Total weight in kg
//     dimensions: object        <- {l: number, b: number, h: number}
//     productSkus: array        <- ["SKU001", "SKU002"] for quick searching
//     verifiedBy: string        <- User ID who verified
//     verifiedAt: timestamp     <- When created
//     updatedBy: string         <- User ID who last updated (optional)
//     updatedAt: timestamp      <- Last update time (optional)
//     notes: string             <- Optional notes (optional)
//     usageCount: number        <- How many times used
//     lastUsedAt: timestamp     <- When last used (optional)
//     isActive: boolean         <- Whether combination is active

// EXAMPLE DOCUMENT:
const exampleCombination = {
  combinationHash: "639c673772c6efffa6ff80b21a67d6f5",
  items: [
    {
      productId: "PROD001",
      productName: "Wireless Mouse",
      sku: "SKU001", 
      quantity: 2,
      unitPrice: 25.99
    },
    {
      productId: "PROD002",
      productName: "Mouse Pad",
      sku: "SKU002",
      quantity: 1,
      unitPrice: 15.99
    }
  ],
  weight: 0.85,
  dimensions: { l: 25, b: 20, h: 8 },
  productSkus: ["SKU001", "SKU002"],
  verifiedBy: "admin-user-123",
  verifiedAt: "2024-01-15T10:30:00.000Z",
  updatedBy: "admin-user-456", 
  updatedAt: "2024-01-20T14:45:00.000Z",
  notes: "Verified manually - packs efficiently together",
  usageCount: 42,
  lastUsedAt: "2024-01-25T09:15:00.000Z",
  isActive: true
};

console.log('📍 Combinations stored in: Firestore > verifiedCombinations');
console.log('🔑 Document ID format: MD5 hash of sorted SKU_quantity pairs');
console.log('📊 Access via: Firebase Console, Admin APIs, or REST endpoints');