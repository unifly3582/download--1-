// src/lib/oms/courierAdapters/delhivery.ts
import { Order } from "@/types/order";
import { db as adminDb } from "@/lib/firebase/server";
import axios from "axios";
import { AdapterResponse } from "./types";

const bookingUrl = "https://track.delhivery.com/api/cmu/create.json";

// Helper function to extract the real error message from Delhivery's response
function getDelhiveryError(apiResponse: any): string {
  if (apiResponse?.packages?.[0]?.remarks) {
    // If the 'remarks' array exists, join its contents for a detailed error.
    return `Delhivery Error: ${apiResponse.packages[0].remarks.join(', ')}`;
  }
  // Fallback to the generic remark if 'remarks' isn't available.
  return `Delhivery API Error: ${apiResponse.rmk || "Unknown error"}`;
}


export async function createDelhiveryShipment(
  orderId: string,
  orderData: Order
): Promise<AdapterResponse> {
  const apiRequest: any = { url: bookingUrl };

  try {
    const settingsRef = adminDb.collection("courierIntegrations").doc("delhivery");
    const settingsSnap = await settingsRef.get();
    if (!settingsSnap.exists) throw new Error("Delhivery settings not found.");
    
    const settings = settingsSnap.data()!;
    const apiKey = settings.api?.authKey;
    const pickupLocationName = settings.pickupLocationName;
    if (!apiKey || !pickupLocationName) throw new Error("Missing Delhivery credentials.");
    
    apiRequest.credentialsUsed = { pickupLocationName };

    const { street, city, state, zip } = orderData.shippingAddress;
    if (!street || !city || !state || !zip) {
        throw new Error(`Order is missing required address fields. Street, City, State, and ZIP are required.`)
    }

    const sanitizedPhone = orderData.customerInfo.phone.replace(/[^0-9]/g, '').slice(-10);

    const shipmentPayload = {
      name: String(orderData.customerInfo.name),
      add: String(`${street}, ${city}, ${state}`),
      pin: String(zip),
      city: String(city),
      state: String(state),
      country: "India",
      phone: sanitizedPhone,
      order: String(orderId), // Fixed: Changed from 'orderid' to 'order' per Delhivery docs
      payment_mode: String(orderData.paymentInfo?.method || "Prepaid"),
      products_desc: String(orderData.items.map(i => i.productName).join(", ")),
      hsn_code: String(orderData.items[0]?.hsnCode || "000000"),
      cod_amount: String(orderData.paymentInfo?.method === "COD" ? orderData.pricingInfo.grandTotal : "0"),
      total_amount: String(orderData.pricingInfo.grandTotal),
      quantity: String(orderData.items.reduce((acc, i) => acc + i.quantity, 0)),
      weight: String(orderData.weight || "0"),
      shipment_width: String(orderData.dimensions?.b || "0"),
      shipment_height: String(orderData.dimensions?.h || "0"),
      shipment_length: String(orderData.dimensions?.l || "0"),
      shipping_mode: "Surface",
      waybill: "",
    };
    
    const jsonPayload = JSON.stringify({
      pickup_location: { name: pickupLocationName },
      shipments: [shipmentPayload],
    });
    
    apiRequest.payload = JSON.parse(jsonPayload);

    const body = new URLSearchParams();
    body.append('format', 'json');
    body.append('data', jsonPayload);

    const res = await axios.post(bookingUrl, body, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    });

    const apiResponse = res.data;

    if (!apiResponse.success) {
      // CORRECT: Use our new helper function to get a better error message
      const errorMessage = getDelhiveryError(apiResponse);
      console.error("[OMS][DELHIVERY][ERROR]", "Failed to create shipment:", apiResponse);
      throw new Error(errorMessage);
    }

    if (!apiResponse.packages || apiResponse.packages.length === 0) {
      throw new Error("Delhivery response did not include package information.");
    }

    console.log("[OMS][DELHIVERY][SUCCESS]", apiResponse);

    // Extract only essential data (optimized storage)
    const awb = apiResponse.packages[0].waybill;
    const uploadWbn = apiResponse.upload_wbn;
    
    return {
      success: true,
      awb,
      trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
      // Essential metadata only (not full API request/response)
      metadata: {
        pickupLocation: pickupLocationName,
        uploadWbn,
        shippedAt: new Date().toISOString(),
      },
      // Keep for error logging only
      apiRequest,
      apiResponse,
    };

  } catch (error: any) {
    // CORRECT: Also use the helper function in the catch block for network errors
    const errorMessage = error.response?.data ? getDelhiveryError(error.response.data) : error.message;
    console.error("[SHIPPING] Error in createDelhiveryShipment:", errorMessage);
    return {
      success: false,
      error: errorMessage,
      // Keep for error debugging only
      apiRequest,
      apiResponse: error.response?.data || null,
    };
  }
}