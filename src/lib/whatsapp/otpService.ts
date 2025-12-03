/**
 * WhatsApp OTP Service
 * Handles OTP generation, sending, and verification for customer authentication
 */

import { db } from '@/lib/firebase/server';
import { auth } from '@/lib/firebase/server';
import admin from 'firebase-admin';

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_REQUESTS_PER_WINDOW = 3;

interface OTPRecord {
  phone: string;
  otp: string;
  expiresAt: admin.firestore.Timestamp;
  attempts: number;
  verified: boolean;
  createdAt: admin.firestore.Timestamp;
}

interface RateLimitRecord {
  phone: string;
  requestCount: number;
  windowStart: admin.firestore.Timestamp;
}

/**
 * Generate a random 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check rate limiting for phone number
 */
async function checkRateLimit(phone: string): Promise<{ allowed: boolean; remainingRequests?: number }> {
  const rateLimitRef = db.collection('otpRateLimits').doc(phone);
  const rateLimitDoc = await rateLimitRef.get();
  
  const now = admin.firestore.Timestamp.now();
  const windowStartTime = new Date(now.toDate().getTime() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  
  if (!rateLimitDoc.exists) {
    // First request
    await rateLimitRef.set({
      phone,
      requestCount: 1,
      windowStart: now
    });
    return { allowed: true, remainingRequests: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  const rateLimitData = rateLimitDoc.data() as RateLimitRecord;
  
  // Check if window has expired
  if (rateLimitData.windowStart.toDate() < windowStartTime) {
    // Reset window
    await rateLimitRef.set({
      phone,
      requestCount: 1,
      windowStart: now
    });
    return { allowed: true, remainingRequests: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  // Check if limit exceeded
  if (rateLimitData.requestCount >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false };
  }
  
  // Increment counter
  await rateLimitRef.update({
    requestCount: admin.firestore.FieldValue.increment(1)
  });
  
  return { allowed: true, remainingRequests: MAX_REQUESTS_PER_WINDOW - rateLimitData.requestCount - 1 };
}

/**
 * Send OTP via WhatsApp using existing Meta Business API
 */
async function sendWhatsAppOTP(phone: string, otp: string): Promise<boolean> {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const baseUrl = 'https://crm.marketingravan.com/api/meta/v19.0';
    
    if (!accessToken || !phoneNumberId) {
      console.error('[OTP] WhatsApp credentials not configured');
      return false;
    }
    
    // Clean phone number (remove + and spaces)
    const cleanPhone = phone.replace(/[\s+\-()]/g, '');
    
    // Build OTP template payload
    const payload = {
      to: cleanPhone,
      recipient_type: "individual",
      type: "template",
      template: {
        language: {
          policy: "deterministic",
          code: "en"
        },
        name: "otp", // Your approved OTP template name
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: otp // OTP code
              }
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: 0,
            parameters: [
              {
                type: "text",
                text: otp // OTP code for button URL parameter
              }
            ]
          }
        ]
      }
    };
    
    console.log('[OTP] Sending WhatsApp OTP to:', cleanPhone);
    
    const response = await fetch(
      `${baseUrl}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('[OTP] WhatsApp API Error:', responseData);
      return false;
    }
    
    console.log('[OTP] WhatsApp OTP sent successfully:', responseData.messages?.[0]?.id);
    return true;
    
  } catch (error) {
    console.error('[OTP] Failed to send WhatsApp OTP:', error);
    return false;
  }
}

/**
 * Request OTP for phone number
 */
export async function requestOTP(phone: string): Promise<{
  success: boolean;
  message: string;
  expiresIn?: number;
}> {
  try {
    // Normalize phone number (remove spaces, dashes)
    const normalizedPhone = phone.replace(/[\s-]/g, '');
    
    // Validate phone format
    if (!/^\+?[1-9]\d{9,14}$/.test(normalizedPhone)) {
      return {
        success: false,
        message: 'Invalid phone number format'
      };
    }
    
    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(normalizedPhone);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        message: `Too many requests. Please try again after ${RATE_LIMIT_WINDOW_MINUTES} minutes.`
      };
    }
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    
    // Store OTP in Firestore
    const otpRef = db.collection('otpVerifications').doc(normalizedPhone);
    await otpRef.set({
      phone: normalizedPhone,
      otp,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      attempts: 0,
      verified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Send OTP via WhatsApp
    const sent = await sendWhatsAppOTP(normalizedPhone, otp);
    
    if (!sent) {
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.'
      };
    }
    
    console.log(`[OTP] OTP sent to ${normalizedPhone} (expires in ${OTP_EXPIRY_MINUTES} minutes)`);
    
    return {
      success: true,
      message: 'OTP sent successfully via WhatsApp',
      expiresIn: OTP_EXPIRY_MINUTES * 60 // seconds
    };
    
  } catch (error: any) {
    console.error('[OTP] Error requesting OTP:', error);
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.'
    };
  }
}

/**
 * Verify OTP and create Firebase custom token
 */
export async function verifyOTP(phone: string, otp: string): Promise<{
  success: boolean;
  message: string;
  customToken?: string;
  customerId?: string;
}> {
  try {
    // Normalize phone number
    const normalizedPhone = phone.replace(/[\s-]/g, '');
    
    // Get OTP record
    const otpRef = db.collection('otpVerifications').doc(normalizedPhone);
    const otpDoc = await otpRef.get();
    
    if (!otpDoc.exists) {
      return {
        success: false,
        message: 'No OTP request found. Please request a new OTP.'
      };
    }
    
    const otpData = otpDoc.data() as OTPRecord;
    
    // Check if already verified
    if (otpData.verified) {
      return {
        success: false,
        message: 'OTP already used. Please request a new OTP.'
      };
    }
    
    // Check expiry
    if (otpData.expiresAt.toDate() < new Date()) {
      await otpRef.delete();
      return {
        success: false,
        message: 'OTP expired. Please request a new OTP.'
      };
    }
    
    // Check max attempts
    if (otpData.attempts >= MAX_ATTEMPTS) {
      await otpRef.delete();
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      };
    }
    
    // Verify OTP
    if (otpData.otp !== otp) {
      // Increment attempts
      await otpRef.update({
        attempts: admin.firestore.FieldValue.increment(1)
      });
      
      const remainingAttempts = MAX_ATTEMPTS - otpData.attempts - 1;
      return {
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
      };
    }
    
    // OTP verified successfully
    await otpRef.update({ verified: true });
    
    // Get or create customer
    const { createOrUpdateCustomer } = await import('@/lib/oms/customerUtils');
    const customer = await createOrUpdateCustomer(normalizedPhone, { phone: normalizedPhone });
    
    // Create Firebase custom token
    const customToken = await auth.createCustomToken(customer.customerId, {
      phone: normalizedPhone,
      role: 'customer'
    });
    
    console.log(`[OTP] Verification successful for ${normalizedPhone}`);
    
    // Clean up OTP record after successful verification
    setTimeout(() => otpRef.delete(), 5000);
    
    return {
      success: true,
      message: 'Verification successful',
      customToken,
      customerId: customer.customerId
    };
    
  } catch (error: any) {
    console.error('[OTP] Error verifying OTP:', error);
    return {
      success: false,
      message: 'Verification failed. Please try again.'
    };
  }
}

/**
 * Resend OTP (with rate limiting)
 */
export async function resendOTP(phone: string): Promise<{
  success: boolean;
  message: string;
  expiresIn?: number;
}> {
  // Delete existing OTP
  const normalizedPhone = phone.replace(/[\s-]/g, '');
  await db.collection('otpVerifications').doc(normalizedPhone).delete();
  
  // Request new OTP
  return requestOTP(phone);
}
