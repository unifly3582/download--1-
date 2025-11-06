## 📍 Firestore Path
Each customer document is stored under:
```
customers/{phone_number}
```
Example: `customers/9876543210`

This acts as the single source of truth for both OMS and AI agent.

---

## 🧩 1. Core Identity Fields

| Field | Type | Description |
|--------|------|-------------|
| `customerId` | string | Internal ID (e.g., CUS_0001) |
| `phone` | string | Customer\'s phone number (document ID) |
| `name` | string | Customer’s name |
| `email` | string | Optional |
| `preferredLanguage` | string | "hi", "en", "ta", etc. |
| `whatsappOptIn` | boolean | Whether opted in for WhatsApp updates |
| `createdAt` | timestamp | First registration date |
| `updatedAt` | timestamp | Last modified date |

---

## 🏠 2. Address & Region Layer

| Field | Type | Description |
|--------|------|-------------|
| `defaultAddress` | object | Default shipping address |
| `savedAddresses` | array<object> | Other addresses |
| `preferredCourier` | string | "amazon", "delhivery", etc. |
| `region` | string | Derived from zip code |

**Example:**
```json
"defaultAddress": {
  "label": "Home",
  "street": "23 Model Town",
  "city": "Delhi",
  "state": "Delhi",
  "zip": "110009",
  "country": "India"
},
"preferredCourier": "amazon",
"region": "Delhi-North"
```

---

## 🔐 3. Trust, Risk & Behavior Profile

| Field | Type | Description |
|--------|------|-------------|
| `isDubious` | boolean | If customer is suspicious |
| `trustScore` | number | 0–100 |
| `loyaltyTier` | string | "new", "repeat", "gold", "platinum" |
| `totalOrders` | number | Total orders |
| `totalSpent` | number | Lifetime spent |
| `lastOrderAt` | timestamp | Last purchase |
| `avgOrderValue` | number | Derived |
| `refundsCount` | number | Refund count |
| `returnRate` | number | refundsCount / totalOrders |
| `blacklistReason` | string | Admin reason |

---

## 💬 4. Communication & Interaction Intelligence

| Field | Type | Description |
|--------|------|-------------|
| `lastInteractionSource` | string | "whatsapp", "website", "ai_agent" |
| `lastInteractionAt` | timestamp | Last interaction timestamp |
| `tags` | array<string> | Segmentation labels |
| `notes` | string | Admin notes |
| `referralSource` | string | "Meta Ads", "Friend", etc. |
| `inactiveSince` | timestamp | If inactive >30 days |
| `customerSegment` | string | "Active", "Dormant", "At Risk" |

---

## 🛒 5. Analytical & Derived Fields

| Field | Type | Description |
|--------|------|-------------|
| `lifetimeValue` | number | Total value of purchases |
| `avgDeliveryTime` | number | Avg. days between ship and delivery |
| `preferredProducts` | array<string> | Frequent products |
| `orderFrequencyDays` | number | Avg. interval between orders |

---

## 🧾 Example Firestore Document

```json
{
  "customerId": "CUS_0001",
  "phone": "9876543210",
  "name": "Rohit Verma",
  "email": "rohit@bugglyfarms.com",
  "preferredLanguage": "hi",
  "whatsappOptIn": true,
  "defaultAddress": {
    "label": "Home",
    "street": "23 Model Town",
    "city": "Delhi",
    "state": "Delhi",
    "zip": "110009",
    "country": "India"
  },
  "preferredCourier": "amazon",
  "region": "Delhi-North",
  "isDubious": false,
  "trustScore": 82,
  "loyaltyTier": "repeat",
  "totalOrders": 12,
  "totalSpent": 1400,
  "lastOrderAt": "2025-10-10T09:42:00Z",
  "avgOrderValue": 116.6,
  "refundsCount": 1,
  "returnRate": 0.08,
  "lastInteractionSource": "whatsapp",
  "lastInteractionAt": "2025-10-11T14:22:00Z",
  "tags": ["bulk-buyer", "feedback-giver"],
  "referralSource": "Meta Ads",
  "customerSegment": "Active",
  "notes": "Asked for Amazon courier last time",
  "lifetimeValue": 1400,
  "orderFrequencyDays": 9,
  "preferredProducts": ["PROD_001", "PROD_002"],
  "createdAt": "server_timestamp",
  "updatedAt": "server_timestamp"
}
```

---

## ⚙️ Customer Intelligence Engine Logic

### 🧠 Purpose
Automatically update and manage customer trust, loyalty, and segmentation after each order.

### 🪄 Triggers
- On new order creation → increment order count
- On successful delivery → update trustScore and loyalty tier
- On refund/cancel → reduce trustScore
- On inactivity → set `customerSegment = "Dormant"`

### 🧮 Example Trust Update Logic
```typescript
if (order.delivered) {
  trustScore = Math.min(100, trustScore + 2);
} else if (order.cancelled) {
  trustScore = Math.max(0, trustScore - 5);
}
```

### 🏅 Loyalty Tier Calculation
| Orders | Tier |
|---------|------|
| 0–2 | new |
| 3–10 | repeat |
| 11–25 | gold |
| 26+ | platinum |

---

## 🔗 OMS + AI Integration

| Module | Uses Fields | Function |
|---------|--------------|----------|
| Auto-Approval | trustScore, isDubious, totalOrders | Determine order approval |
| Courier Routing | preferredCourier, region | Auto-select courier |
| WhatsApp Bot | preferredLanguage, tags | Send localized templates |
| Retargeting | inactiveSince, orderFrequencyDays | Trigger follow-up messages |
| CRM Dashboard | totalSpent, customerSegment | Visualize user health |

---The following snippets may be helpful:
From docs/orders_blueprint.md in local codebase:
```
Line 360:     ---
Line 361:     
Line 362:     ## 🔚 Summary
Line 363:     
Line 364:     | Module | Purpose | Key Collection | Key Output |
Line 365:     |--------|----------|----------------|-------------|
Line 366:     | Order Engine | Create and store orders | \`orders\` | \`orderId\` |
Line 367:     | Approval Engine | Auto/manual approval | \`autoApprovalSettings\` | \`approval.status\` |
Line 368:     | Courier Engine | Assign couriers & create shipment | \`courierIntegrations\` | \`awb\` |
Line 369:     | Tracking Engine | Sync courier status | \`orders\` | \`internalStatus\` |
Line 370:     | Notification Engine | Send updates | \`notifications\` | WhatsApp templates |
Line 371:     | Admin Dashboard | Control panel | — | UI Interface |
Line 372:     
Line 373:     ---
Line 374:     
Line 375:     **End of File**
```

From addDoc.js in local codebase:
```
Line 15:      const db = admin.firestore();
Line 16:      
Line 17:      async function addDelhiveryConfig() {
Line 18:        try {
Line 19:          const docRef = db.collection(\'courierIntegrations\').doc(\'delhivery\');
Line 20:          await docRef.set({
Line 21:            name: \'Delhivery\',
Line 22:            api: {
Line 23:              baseUrl: \'https://track.delhivery.com\',
Line 24:              bookingEndpoint: \'/api/cmu/create.json\',
Line 25:              authKey: \'YOUR_DELHIVERY_API_KEY\', // IMPORTANT: Replace with your actual key
Line 26:            },
Line 27:            createdAt: admin.firestore.FieldValue.serverTimestamp(),
Line 28:            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
Line 29:          });
Line 30:          console.log(\'Successfully created courierIntegrations/delhivery document.\');
Line 31:        } catch (error) {
Line 32:          console.error(\'Error creating document:\', error.message);
Line 33:        } finally {
Line 34:          admin.app().delete();
Line 35:        }
Line 36:      }
Line 37:      
Line 38:      addDelhiveryConfig();
```

From docs/orders_blueprint.md in local codebase:
```
Line 193:     ## 3️⃣ Lifecycle & Status Protocol
Line 194:     
Line 195:     | Stage | internalStatus | Trigger | Source | Description |
Line 196:     |--------|----------------|----------|----------|--------------|
Line 197:     | 1 | created_pending | Order creation | Admin / AI / App | Awaiting approval |
Line 198:     | 2 | approved | Auto/manual approval | Rule engine / Admin | Ready for shipping |
Line 199:     | 3 | ready_for_shipping | Courier assigned | Admin / API | AWB pending |
Line 200:     | 4 | shipped | API booking success | Courier API | Parcel booked |
Line 201:     | 5 | in_transit | Courier update | API/Webhook | Shipment moving |
Line 202:     | 6 | delivered | Courier webhook | API/Webhook | Completed |
Line 203:     | 7 | return_initiated | Courier update | Webhook | RTO/Return started |
Line 204:     | 8 | returned | Courier update | Webhook | Parcel returned |
Line 205:     | 9 | cancelled | Admin/Customer | Manual | Order stopped |
Line 206:     
Line 207:     ---
Line 208:     
Line 209:     ## 4️⃣ Approval Engine
```



| **Firebase product**                                                                  | **Library reference**                                                                                                             |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Firebase core *(required)*                                                            | `import {} from "firebase/app";`                                                                                                  |
| [Firebase AI Logic](/docs/ai-logic/get-started) 1                                     | `import {} from "firebase/ai";`                                                                                                   |

| Firebase product           | Edge                      | Firefox | Chrome | iOS Safari                       | Safari |
| -------------------------- | ------------------------- | ------- | ------ | -------------------------------- | ------ |
| **Firebase AI Logic** 1    |                           |         |        |                                  |        |
| **Analytics**              |                           |         |        |                                  |        |
| **App Check**              |                           |         |        |                                  |        |
| **Authentication**         |                           |         |        |                                  |        |
| **Cloud Firestore**        | (except persistence)      |         |        | (except persistence if iOS < 10) |        |
| **Cloud Functions**        |                           |         |        |                                  |        |