
// Defines the standardized response shapes for all courier adapters.

export type AdapterSuccessResponse = {
  success: true;
  awb: string;
  trackingUrl: string;
  metadata?: {
    pickupLocation?: string;
    uploadWbn?: string;
    shippedAt?: string;
    [key: string]: any;
  };
  apiRequest?: any;   // The request payload sent to the courier API (for logging only)
  apiResponse?: any;  // The full response received from the courier API (for logging only)
};

export type AdapterErrorResponse = {
  success: false;
  error: string;
  apiRequest?: any;   // The request payload sent to the courier API (for debugging)
  apiResponse?: any;  // The full response received from the courier API (for debugging)
};

export type AdapterResponse = AdapterSuccessResponse | AdapterErrorResponse;
