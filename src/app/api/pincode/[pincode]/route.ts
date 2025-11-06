import { NextRequest, NextResponse } from 'next/server';

const PINCODE_API_URL = 'https://api.postalpincode.in/pincode/';

export async function GET(
  request: NextRequest,
  { params }: { params: { pincode: string } }
) {
  try {
    const { pincode } = params;
    
    // Validate pincode format
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pincode format' },
        { status: 400 }
      );
    }
    
    // Fetch data from external Indian Postal API
    const response = await fetch(`${PINCODE_API_URL}${pincode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pincode data' },
        { status: 500 }
      );
    }
    
    const data = await response.json();
    
    // Check if the API returned valid data
    if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
      const postOffice = data[0].PostOffice[0];
      
      return NextResponse.json({
        success: true,
        data: {
          city: postOffice.District,
          state: postOffice.State,
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Pincode not found' },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Pincode lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}