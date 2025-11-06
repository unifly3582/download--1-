
// Defines the standardized response shapes for all courier adapters.

export type AdapterSuccessResponse = {
  success: true;
  awb: string;
  trackingUrl: string;
  apiRequest?: any;   // The request payload sent to the courier API
  apiResponse?: any;  // The full response received from the courier API
};

export type AdapterErrorResponse = {
  success: false;
  error: string;
  apiRequest?: any;   // The request payload sent to the courier API
  apiResponse?: any;  // The full response received from the courier API (even in case of error)
};

export type AdapterResponse = AdapterSuccessResponse | AdapterErrorResponse;
