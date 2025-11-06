
import { AdapterResponse } from "./types"; // Import the new type

export async function createManualShipment(
  orderId: string, 
  orderData: any, // Unused, but kept for consistent function signature
  manualAwb: string
): Promise<AdapterResponse> { // Add return type
  
  const apiRequest = {
    orderId,
    manualAwb,
    timestamp: new Date().toISOString()
  }

  if (!manualAwb || manualAwb.trim() === '') {
      const errorMsg = "Manual shipment requires a valid AWB number.";
      console.error(`[OMS][MANUAL][ERROR] Order ID: ${orderId} - ${errorMsg}`);
      return {
          success: false,
          error: errorMsg,
          apiRequest: apiRequest,
          apiResponse: { error: errorMsg }
      };
  }
  
  const awb = manualAwb.trim();
  const trackingUrl = `https://bugglyfarms.com/track/${awb}`;

  return {
    success: true,
    awb: awb,
    trackingUrl: trackingUrl,
    apiRequest: apiRequest,
    apiResponse: {
        awb,
        trackingUrl
    }
  };
}
