# Manual Test Scripts

This directory contains manual test scripts for testing specific features and integrations.

## ⚠️ Important

These scripts are for **manual testing only** and are **not** part of the automated test suite.

## Scripts Overview

### WhatsApp Integration Tests
- `test-whatsapp-*.js` - Various WhatsApp API integration tests
- `send-whatsapp-test.js` - Send test WhatsApp messages
- `send-order-confirmation.js` - Test order confirmation messages

### Order Management Tests
- `test-order-*.js` - Order creation and management tests
- `test-place-order.js` - Test order placement flow
- `test-ship-order-flow.js` - Test shipping workflow

### Customer Management Tests
- `test-customer-*.js` - Customer management tests
- `test-customer-search-*.js` - Customer search functionality tests

### API Tests
- `test-api-key.js` - API key validation
- `test-customer-api-endpoints.js` - Customer API endpoints

## Usage

### Prerequisites
```bash
# Ensure environment variables are set
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### Running Tests
```bash
# Run a specific test
node tests/manual/test-whatsapp-send.js

# Or from root directory
node tests/manual/test-order-placed.js
```

## Environment Variables Required

Most tests require these environment variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `RAZORPAY_WEBHOOK_SECRET`

## Notes

- These tests may create real data in your database
- Use test/development environment only
- Some tests require specific data to exist (customers, products, etc.)
- Review each script before running to understand what it does

## Migrating to Automated Tests

If you want to convert these to automated tests:
1. Move logic to `tests/integration/` or `tests/unit/`
2. Use Jest test framework
3. Mock external services (Firebase, WhatsApp, etc.)
4. Add assertions and test cases
5. Remove from this directory

## Cleanup

After migrating to automated tests, you can safely delete these manual scripts.
