import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCustomerByPhone, createOrUpdateCustomer } from '@/lib/oms/customerUtils';
import { addCorsHeaders } from '@/lib/products/productUtils';

// Customer profile schema for validation
const CustomerProfileSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').optional(),
  defaultAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required')
  }).optional()
});

/**
 * POST /api/customer/profile
 * Get or update customer profile (no authentication required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, ...profileData } = body;
    
    if (!phone) {
      const response = NextResponse.json({
        success: false,
        error: 'Phone number is required'
      }, { status: 400 });
      return addCorsHeaders(response);
    }
    
    if (action === 'get') {
      // Get customer profile
      const customer = await getCustomerByPhone(phone);
      
      if (!customer) {
        const response = NextResponse.json({
          success: false,
          error: 'Customer not found'
        }, { status: 404 });
        return addCorsHeaders(response);
      }
      
      // Return public profile data only
      const publicProfile = {
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        defaultAddress: customer.defaultAddress,
        savedAddresses: customer.savedAddresses || [],
        loyaltyTier: customer.loyaltyTier,
        totalOrders: customer.totalOrders,
        memberSince: customer.createdAt
      };
      
      const response = NextResponse.json({
        success: true,
        data: publicProfile
      });
      return addCorsHeaders(response);
    }
    
    if (action === 'update') {
      // Validate profile data
      const validation = CustomerProfileSchema.safeParse({ phone, ...profileData });
      
      if (!validation.success) {
        const response = NextResponse.json({
          success: false,
          error: 'Invalid profile data',
          details: validation.error.flatten().fieldErrors
        }, { status: 400 });
        return addCorsHeaders(response);
      }
      
      // Update customer profile
      const updatedCustomer = await createOrUpdateCustomer(
        phone,
        validation.data,
        validation.data.defaultAddress
      );
      
      // Return updated public profile
      const publicProfile = {
        customerId: updatedCustomer.customerId,
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        defaultAddress: updatedCustomer.defaultAddress,
        savedAddresses: updatedCustomer.savedAddresses || [],
        loyaltyTier: updatedCustomer.loyaltyTier,
        totalOrders: updatedCustomer.totalOrders
      };
      
      const response = NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        data: publicProfile
      });
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json({
      success: false,
      error: 'Invalid action. Use "get" or "update"'
    }, { status: 400 });
    return addCorsHeaders(response);
    
  } catch (error: any) {
    console.error('[CUSTOMER PROFILE] Error:', error);
    const response = NextResponse.json({
      success: false,
      error: 'Failed to manage profile'
    }, { status: 500 });
    return addCorsHeaders(response);
  }
}

/**
 * Handle OPTIONS for CORS
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}