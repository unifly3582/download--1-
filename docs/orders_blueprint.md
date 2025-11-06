# 🧠 BUGGLY OMS (Order Management System) — MASTER BLUEPRINT

### Project: Buggly Farms
### Stack: **Next.js (TypeScript)** + **Firebase Firestore** + **Firebase Admin SDK**
### Modules: Orders • Customers • Shipping • Tracking • Notifications • Dashboard Analytics
### Goal: End-to-end intelligent order orchestration with AI and automation

---

## 1️⃣ Overview

The **Buggly OMS** (Order Management System) is a unified platform for managing all operations of the Buggly e-commerce ecosystem.  
It handles every stage of the order lifecycle — from creation and approval to shipping, tracking, and post-delivery analytics — across multiple input channels:

- Admin panel (manual entry)
- Website or mobile app (customer orders)
- AI agent (WhatsApp or chatbot orders)

The OMS acts as a **central brain** integrating:
- Order creation, approval, and lifecycle control  
- Customer intelligence and trust scoring  
- Multi-courier integration for shipping  
- Automatic tracking synchronization  
- WhatsApp event notifications  
- Insightful admin dashboard and analytics  

---

## 2️⃣ Core Architecture

### 🧩 **Frontend**
Built with **Next.js (App Router)** + **TypeScript** + **shadcn/ui** + **Recharts**.

- `/src/app/(dashboard)/` — Admin interface (Orders, Customers, Tracking, etc.)
- Modular, responsive layout with reusable components
- Uses React hooks + context for state management

### 🧩 **Backend**
Built within the same Next.js project using **API Routes** and **Firebase Admin SDK**.

- `/src/app/api/orders/` → Order creation, update, shipping
- `/src/app/api/customers/` → Customer data and metrics
- `/src/lib/oms/` → Core OMS logic (auto-approval, shipping, tracking, notifications)

### 🧩 **Database: Firebase Firestore**
Collections include:
- `orders`
- `customers`
- `autoApprovalSettings`
- `verifiedCombinations`
- `courierIntegrations`

All timestamps use `serverTimestamp()` and are transformed to ISO strings for frontend use.

---

## 3️⃣ Order Management Lifecycle

### 🔹 Step 1 — Order Creation

Orders are created via:
- Admin Panel form
- Customer App
- AI Chatbot

Handled by API endpoint: `POST /api/orders`

Validations via **Zod OrderSchema**, linking customers and triggering auto-approval.  
Sets `internalStatus = "created_pending"` unless auto-approved.

### 🔹 Step 2 — Auto-Approval Engine

Located at `/src/lib/oms/autoApproval.ts`.  
Logic checks:
- Customer not marked `isDubious`
- Existing customer in database
- Order value ≤ configurable limit
- Verified product/quantity combination exists

Approved orders automatically move to “approved” status.

### 🔹 Step 3 — Shipping & Courier Integration

Files:
- `/src/lib/oms/shipping.ts`
- `/src/lib/oms/courierAdapters/delhivery.ts`
- `/src/lib/oms/courierAdapters/manual.ts`

Handles courier assignment and AWB generation using `POST /api/orders/{orderId}/ship`.  
Supports multiple courier APIs (Delhivery integrated first).  
Stores courier data in Firestore.

### 🔹 Step 4 — Tracking & Status Synchronization

File: `/src/lib/oms/tracking.ts` *(upcoming)*  
Automatically syncs tracking data from courier APIs and updates Firestore order statuses.

| Courier Status | OMS Status |
|-----------------|-------------|
| In Transit | `in_transit` |
| Delivered | `delivered` |
| RTO Initiated | `return_initiated` |
| RTO Delivered | `returned` |

### 🔹 Step 5 — Notifications (WhatsApp)

File: `/src/lib/oms/notifications.ts` *(upcoming)*  
Event-driven service using Meta WhatsApp Cloud API.  
Triggers notifications for order updates like “shipped”, “delivered”, “returned”.

---

## 4️⃣ Customer Intelligence System

This is the system’s CRM & intelligence core.

### 🔹 Core Files
- `/src/lib/oms/customerUtils.ts` — CRUD, trust score, loyalty tier updates
- `/src/lib/oms/customerIntelligence.ts` — Auto updates after orders
- `/src/app/api/customers/` — REST APIs for AI and Admin

### 🔹 Key Fields
| Field | Purpose |
|-------|----------|
| `trustScore` | Numerical reliability rating (0–100) |
| `loyaltyTier` | `new` / `repeat` / `gold` / `platinum` |
| `lifetimeValue` | Cumulative spending |
| `avgOrderValue` | Mean order value |
| `refundsCount` | Count of refunds |
| `returnRate` | Refund % |
| `preferredCourier` | Customer’s courier preference |
| `preferredLanguage` | For WhatsApp messages |
| `isDubious` | Fraud flag |
| `tags` | CRM labeling |

Customer updates happen automatically after each order.

---

## 5️⃣ Admin Dashboard UI

Built with **Next.js + shadcn/ui**, styled using **Tailwind CSS** and **Recharts**.

### Pages Overview
| Page | Function | Status |
|------|-----------|--------|
| `/dashboard` | Analytics Overview | ⚙️ Building |
| `/dashboard/orders` | Order Lifecycle | ⚙️ Building |
| `/dashboard/customers` | Customer CRM | ✅ Functional |
| `/dashboard/tracking` | Live Tracking | 🛠 Pending |
| `/dashboard/shipping` | Courier Settings | 🛠 Pending |
| `/dashboard/notifications` | WhatsApp Logs | 🛠 Planned |

### Design System
- **Theme:** Green + Brown + Cream (Earthy tones)
- **Framework:** shadcn/ui + Lucide icons
- **Responsive:** Mobile-first layout

### Features
- Orders and Customers tables
- Inline edit, search, and pagination
- Quick status filtering
- Analytics summary cards and charts

---

## 6️⃣ OMS Intelligence & Automation Summary

| System | Type | Purpose |
|--------|------|----------|
| Auto-Approval | Predictive | Reduce workload |
| Trust Score | Behavioral | Detect risk |
| Preferred Courier | Personalization | Enhance delivery reliability |
| Tracking Sync | Operational | Auto status updates |
| Notifications | Reactive | Customer engagement |
| Analytics | Strategic | Insight & optimization |

---

## 7️⃣ Security & Reliability

- Firebase Authentication for Admin Access  
- Firestore Security Rules for data control  
- Zod validation for all API endpoints  
- All keys stored securely (no hardcoded values)  
- Graceful error handling for Firestore updates  

---

## 8️⃣ Roadmap

| Phase | Focus | Outcome |
|--------|--------|----------|
| ✅ 1 | Orders + Auto-Approval | Complete |
| ✅ 2 | Customer Intelligence | Complete |
| ✅ 3 | Courier Integration | Delhivery & Manual Done |
| ⚙️ 4 | UI Rebuild | Unified Dashboard in Progress |
| 🔜 5 | Tracking Automation | Scheduled next |
| 🔜 6 | Notifications | WhatsApp Templates |
| 🔜 7 | Analytics & BI | Admin-level visualization |

---

## 9️⃣ Final Summary

The **Buggly OMS** is an AI-driven, automation-first management system for insect-based e-commerce.  
It is designed not only to process data but to **understand and act** — automating approvals, optimizing logistics, and enabling personalized communication.

### System Strengths
✅ Unified architecture (Next.js + Firebase)  
✅ Intelligent workflows (auto approval, trust, courier)  
✅ Data-driven insights (customers, couriers, performance)  
✅ AI-ready integrations (WhatsApp, chatbot)  
✅ Modular scaling (tracking, analytics, CRM)

---

**Buggly OMS is the operational backbone that powers Unifly and Buggly Farms — built for intelligence, automation, and scale.**
