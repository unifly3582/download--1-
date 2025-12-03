# WhatsApp OTP Authentication Implementation

## Overview
Replaced Firebase Phone Auth (with reCAPTCHA issues) with WhatsApp OTP authentication using your existing Meta Business API integration.

## Backend Implementation

### 1. OTP Service (`src/lib/whatsapp/otpService.ts`)

**Features:**
- 6-digit OTP generation
- 5-minute expiry
- Rate limiting (3 requests per 15 minutes)
- Max 3 verification attempts
- Firebase custom token generation after verification

**Key Functions:**
- `requestOTP(phone)` - Send OTP via WhatsApp
- `verifyOTP(phone, otp)` - Verify OTP and return custom token
- `resendOTP(phone)` - Resend OTP with rate limiting

### 2. API Endpoints

**POST `/api/customer/auth/request-otp`**
```json
Request:
{
  "phone": "+919876543210"
}

Response:
{
  "success": true,
  "message": "OTP sent successfully via WhatsApp",
  "expiresIn": 300
}
```

**POST `/api/customer/auth/verify-otp`**
```json
Request:
{
  "phone": "+919876543210",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "Verification successful",
  "customToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customerId": "cust_abc123"
}
```

**POST `/api/customer/auth/resend-otp`**
```json
Request:
{
  "phone": "+919876543210"
}

Response:
{
  "success": true,
  "message": "OTP sent successfully via WhatsApp",
  "expiresIn": 300
}
```

## Frontend Implementation Example

### React/Next.js Customer Login Component

```tsx
'use client';

import { useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function CustomerLogin() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/customer/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (data.success) {
        setStep('otp');
        setExpiresIn(data.expiresIn);
        // Start countdown timer
        startCountdown(data.expiresIn);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/customer/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });

      const data = await response.json();

      if (data.success && data.customToken) {
        // Sign in with Firebase custom token
        await signInWithCustomToken(auth, data.customToken);
        // Redirect to customer app
        window.location.href = '/shop';
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/customer/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (data.success) {
        setExpiresIn(data.expiresIn);
        startCountdown(data.expiresIn);
        setError('OTP resent successfully');
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (seconds: number) => {
    // Implement countdown timer UI
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Login with WhatsApp</h1>

      {step === 'phone' ? (
        <form onSubmit={handleRequestOTP}>
          <div className="mb-4">
            <label className="block mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              className="w-full p-3 border rounded"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded"
          >
            {loading ? 'Sending...' : 'Send OTP via WhatsApp'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <div className="mb-4">
            <label className="block mb-2">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full p-3 border rounded text-center text-2xl"
              required
            />
            <p className="text-sm text-gray-600 mt-2">
              OTP sent to {phone}
            </p>
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded mb-3"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={loading}
            className="w-full bg-gray-200 text-gray-700 p-3 rounded"
          >
            Resend OTP
          </button>
          <button
            type="button"
            onClick={() => setStep('phone')}
            className="w-full text-blue-600 mt-3"
          >
            Change Phone Number
          </button>
        </form>
      )}
    </div>
  );
}
```

## Security Features

1. **Rate Limiting**: Max 3 OTP requests per 15 minutes per phone number
2. **OTP Expiry**: OTPs expire after 5 minutes
3. **Attempt Limiting**: Max 3 verification attempts per OTP
4. **Auto-cleanup**: Used OTPs are deleted after verification
5. **Firebase Custom Tokens**: Secure authentication with Firebase

## Firestore Collections

### `otpVerifications` Collection
```
Document ID: {phone_number}
{
  phone: string,
  otp: string,
  expiresAt: Timestamp,
  attempts: number,
  verified: boolean,
  createdAt: Timestamp
}
```

### `otpRateLimits` Collection
```
Document ID: {phone_number}
{
  phone: string,
  requestCount: number,
  windowStart: Timestamp
}
```

## Environment Variables

Already configured in `.env.local`:
```env
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=826202023907538
WHATSAPP_BUSINESS_ACCOUNT_ID=1479411936430690
```

## WhatsApp Template

Your approved "otp" template structure:
```json
{
  "name": "otp",
  "language": "en",
  "components": [
    {
      "type": "body",
      "parameters": [{ "type": "text", "text": "OTP_CODE" }]
    },
    {
      "type": "button",
      "sub_type": "url",
      "index": 0,
      "parameters": [{ "type": "text", "text": "OTP_CODE" }]
    }
  ]
}
```

## Testing

### 1. Test OTP Request
```bash
curl -X POST http://localhost:3000/api/customer/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

### 2. Test OTP Verification
```bash
curl -X POST http://localhost:3000/api/customer/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "123456"}'
```

## Migration from Firebase Phone Auth

### Before (Firebase Phone Auth with reCAPTCHA)
```tsx
// ❌ Old approach with reCAPTCHA issues
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const appVerifier = new RecaptchaVerifier('recaptcha-container', {}, auth);
const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
await confirmationResult.confirm(otp);
```

### After (WhatsApp OTP)
```tsx
// ✅ New approach - no reCAPTCHA needed
const response = await fetch('/api/customer/auth/request-otp', {
  method: 'POST',
  body: JSON.stringify({ phone })
});

const { customToken } = await fetch('/api/customer/auth/verify-otp', {
  method: 'POST',
  body: JSON.stringify({ phone, otp })
}).then(r => r.json());

await signInWithCustomToken(auth, customToken);
```

## Benefits

✅ No reCAPTCHA issues
✅ Better user experience (WhatsApp is familiar)
✅ Higher delivery rates in India
✅ Uses existing WhatsApp Business API
✅ Secure with rate limiting and expiry
✅ Automatic customer creation
✅ Works with existing Firebase Auth

## Next Steps

1. Create customer-facing login page using the example component
2. Add OTP verification to your customer app
3. Update customer order creation to require authentication
4. Test with real phone numbers
5. Monitor OTP delivery rates in WhatsApp Business Manager
