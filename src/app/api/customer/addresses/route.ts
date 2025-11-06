import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getCustomerByPhone, 
  addCustomerAddress, 
  updateCustomerAddress, 
  removeCustomerAddress, 
  setDefaultAddress 
} from '@/lib/oms/customerUtils';

// Address schema for validation
const AddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required')
});

const CustomerAddressRequestSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  action: z.enum(['add', 'update', 'remove', 'setDefault', 'get']),
  address: AddressSchema.optional(),
  oldAddress: AddressSchema.optional(),
  newAddress: AddressSchema.optional(),
  setAsDefault: z.boolean().optional().default(false)
});

/**
 * POST /api/customer/addresses
 * Customer-facing address management (no authentication required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = CustomerAddressRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { phone, action, address, oldAddress, newAddress, setAsDefault } = validation.data;
    let result;

    switch (action) {
      case 'get':
        const customer = await getCustomerByPhone(phone);
        if (!customer) {
          return NextResponse.json(
            { success: false, error: 'Customer not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          data: {
            defaultAddress: customer.defaultAddress || null,
            savedAddresses: customer.savedAddresses || [],
            totalAddresses: (customer.savedAddresses || []).length
          }
        });

      case 'add':
        if (!address) {
          return NextResponse.json(
            { success: false, error: 'Address is required for add action' },
            { status: 400 }
          );
        }
        result = await addCustomerAddress(phone, address, setAsDefault);
        break;

      case 'update':
        if (!oldAddress || !newAddress) {
          return NextResponse.json(
            { success: false, error: 'Both oldAddress and newAddress are required for update action' },
            { status: 400 }
          );
        }
        result = await updateCustomerAddress(phone, oldAddress, newAddress, setAsDefault);
        break;

      case 'remove':
        if (!address) {
          return NextResponse.json(
            { success: false, error: 'Address is required for remove action' },
            { status: 400 }
          );
        }
        result = await removeCustomerAddress(phone, address);
        break;

      case 'setDefault':
        if (!address) {
          return NextResponse.json(
            { success: false, error: 'Address is required for setDefault action' },
            { status: 400 }
          );
        }
        result = await setDefaultAddress(phone, address);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[CUSTOMER ADDRESSES] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage address' },
      { status: 500 }
    );
  }
}