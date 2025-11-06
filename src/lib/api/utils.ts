// src/lib/api/utils.ts
import { auth } from '@/lib/firebase/client'; // Assumes your client-side firebase config is here
import { toast } from '@/hooks/use-toast'; // Or your preferred notification system

/**
 * A wrapper around the native fetch API that automatically adds the
 * Firebase Auth ID token to the request headers.
 * It also provides centralized error handling.
 *
 * @param url The API endpoint to call.
 * @param options The standard fetch options (method, body, etc.).
 * @returns The JSON response from the API.
 * @throws An error if the request fails or the user is not authenticated.
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) {
    toast({ title: 'Authentication Error', description: 'You are not logged in. Please refresh and try again.', variant: 'destructive' });
    throw new Error('User not authenticated.');
  }

  try {
    const token = await user.getIdToken();

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, { ...options, headers });
    const result = await response.json();

    if (!response.ok) {
      // Use the server's error message if available, otherwise a default
      const errorMessage = result.error || `Request failed with status ${response.status}`;
      
      // Log error details only if they exist
      if (result.details) {
        console.error("API Error details:", result.details);
      } else {
        console.error("API Error:", errorMessage, `(Status: ${response.status})`);
      }
      
      throw new Error(errorMessage);
    }

    return result;

  } catch (error: any) {
    // Re-throw the error so the calling component can handle it (e.g., in its own catch block)
    throw error;
  }
}

/**
 * An authenticated fetch wrapper specifically for sending FormData (file uploads).
 * It correctly omits the 'Content-Type' header, allowing the browser to set it.
 *
 * @param url The API endpoint to call.
 * @param options The standard fetch options, where 'body' is a FormData object.
 * @returns The JSON response from the API.
 * @throws An error if the request fails or the user is not authenticated.
 */
export async function authenticatedFormDataFetch(url: string, options: RequestInit = {}) {
  const user = (await import('@/lib/firebase/client')).auth.currentUser;
  if (!user) {
    // You can use toast here if this file is client-side, otherwise just throw.
    throw new Error('User not authenticated.');
  }

  try {
    const token = await user.getIdToken();

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    // DO NOT set 'Content-Type' for FormData

    const response = await fetch(url, { ...options, headers });
    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.error || `Request failed with status ${response.status}`;
      
      // Log error details only if they exist
      if (result.details) {
        console.error("API Error details:", result.details);
      } else {
        console.error("API Error:", errorMessage, `(Status: ${response.status})`);
      }
      
      throw new Error(errorMessage);
    }

    return result;

  } catch (error: any) {
    throw error;
  }
}
