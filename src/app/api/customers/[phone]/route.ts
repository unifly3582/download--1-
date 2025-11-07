import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/server";
import { CustomerSchema } from "@/types/customers";
import { Order, OrderSchema } from "@/types/order";
import { getCustomerByPhone, createOrUpdateCustomer } from "@/lib/oms/customerUtils";
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

async function getCustomerHandler(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const { phone } = await params;
  console.log(`[customers API] GET request for customer profile: ${phone}`);

  try {
    const customer = await getCustomerByPhone(phone);

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    // Fetch the customer's orders
    const ordersSnapshot = await db.collection('orders').where('customerInfo.phone', '==', phone).orderBy('createdAt', 'desc').get();
    
    const orders: Order[] = [];
    ordersSnapshot.forEach(doc => {
        const data = doc.data();
        // Serialize all potential timestamps for JSON response
        const dataWithSerializableDates = {
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          approval: {
            ...data.approval,
            approvedAt: data.approval?.approvedAt?.toDate ? data.approval.approvedAt.toDate().toISOString() : data.approval?.approvedAt,
          },
          shipmentDetails: {
            ...data.shipmentDetails,
            shippedAt: data.shipmentDetails?.shippedAt?.toDate ? data.shipmentDetails.shippedAt.toDate().toISOString() : data.shipmentDetails?.shippedAt,
          }
        };
        
        const validation = OrderSchema.safeParse(dataWithSerializableDates);
        if (validation.success) {
          orders.push(validation.data);
        } else {
          console.warn(`[Customer Orders] Invalid order data for doc ${doc.id} in customer profile fetch:`, validation.error.flatten());
        }
    });

    const customerProfile = {
      ...customer,
      orders: orders,
    };

    return NextResponse.json({ success: true, data: customerProfile });

  } catch (error: any) {
    console.error(`[customers API] Error fetching customer profile for ${phone}:`, error.message);
    if (error.code === 'FAILED_PRECONDITION') {
      return NextResponse.json({ success: false, error: 'A database index is required for this query. Check server logs for a link to create it.' }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: "Failed to fetch customer profile" }, { status: 500 });
  }
}

async function updateCustomerHandler(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const { phone } = await params;
  console.log(`[customers API] PUT request for customer: ${phone}`);

  try {
    const body = await request.json();
    const validation = CustomerSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
    }

    await createOrUpdateCustomer(phone, validation.data);
    const updatedCustomer = await getCustomerByPhone(phone);

    return NextResponse.json({ success: true, data: updatedCustomer });

  } catch (error: any) {
    console.error(`[customers API] Error updating customer ${phone}:`, error.message);
    return NextResponse.json({ success: false, error: "Failed to update customer" }, { status: 500 });
  }
}

export const GET = withAuth(['admin'])(getCustomerHandler);
export const PUT = withAuth(['admin'])(updateCustomerHandler);
