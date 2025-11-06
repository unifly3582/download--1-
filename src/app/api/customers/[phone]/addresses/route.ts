import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/withAuth';
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

const AddAddressSchema = z.object({
  action: z.literal('add'),
  address: AddressSchema,
  setAsDefault: z.boolean().optional().default(false)
});

const UpdateAddressSchema = z.object({
  action: z.literal('update'),
  oldAddress: AddressSchema,
  newAddress: AddressSchema,
  setAsDefault: z.boolean().optional().default(false)
});

const RemoveAddressSchema = z.object({
  action: z.literal('remove'),
  address: AddressSchema
});

const SetDefaultAddressSchema = z.object({
  action: z.literal('setDefault'),
  address: AddressSchema
});

const AddressActionSchema = z.discriminatedUnion('action', [
  AddAddressSchema,
  UpdateAddressSchema,
  RemoveAddressSchema,
  SetDefaultAddressSchema
]);

/**
 * GET /api/customers/[phone]/addresses
 * Get customer's address book
 */
async function getAddressesHandler(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const phone = decodeURIComponent(params.phone);
    
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

  } catch (error: any) {
    console.error('[GET ADDRESSES] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers/[phone]/addresses
 * Manage customer addresses (add, update, remove, setDefault)
 */
async function manageAddressesHandler(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const phone = decodeURIComponent(params.phone);
    const body = await request.json();
    
    // Validate request body
    const validation = AddressActionSchema.safeParse(body);
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

    const actionData = validation.data;
    let result;

    switch (actionData.action) {
      case 'add':
        result = await addCustomerAddress(
          phone, 
          actionData.address, 
          actionData.setAsDefault
        );
        break;

      case 'update':
        result = await updateCustomerAddress(
          phone, 
          actionData.oldAddress, 
          actionData.newAddress, 
          actionData.setAsDefault
        );
        break;

      case 'remove':
        result = await removeCustomerAddress(phone, actionData.address);
        break;

      case 'setDefault':
        result = await setDefaultAddress(phone, actionData.address);
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
    console.error('[MANAGE ADDRESSES] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage address' },
      { status: 500 }
    );
  }
}

// Export with authentication
export const GET = withAuth(['admin'])(getAddressesHandler as any);
export const POST = withAuth(['admin'])(manageAddressesHandler as any);