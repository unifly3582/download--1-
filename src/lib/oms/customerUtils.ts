
import { db } from "@/lib/firebase/server";
import { CustomerSchema, Customer } from "@/types/customers";
import admin from "firebase-admin";

// Helper function to compare addresses with normalization
function addressesEqual(addr1: any, addr2: any): boolean {
    if (!addr1 || !addr2) return false;
    
    // Normalize function to handle case, whitespace, and common variations
    const normalize = (str: string): string => {
        if (!str) return '';
        return str.toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/apartment/gi, 'apt')
            .replace(/building/gi, 'bldg')
            .replace(/street/gi, 'st')
            .replace(/road/gi, 'rd')
            .replace(/avenue/gi, 'ave');
    };
    
    return normalize(addr1.street) === normalize(addr2.street) && 
           normalize(addr1.city) === normalize(addr2.city) && 
           normalize(addr1.state) === normalize(addr2.state) && 
           normalize(addr1.zip) === normalize(addr2.zip) &&
           normalize(addr1.country) === normalize(addr2.country);
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
    try {
        // Normalize phone number for consistent lookup
        const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
        console.log(`[OMS][CUSTOMER_UTILS] Looking up customer with phone: ${normalizedPhone} (original: ${phone})`);
        
        // Try method 1: Query by normalized phone field - ORDER BY createdAt DESC to get newest first
        let querySnapshot = await db.collection("customers")
            .where('phone', '==', normalizedPhone)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        
        // If not found with normalized phone, try with original phone (for backward compatibility)
        if (querySnapshot.empty && phone !== normalizedPhone) {
            console.log(`[OMS][CUSTOMER_UTILS] Not found with normalized phone, trying original: ${phone}`);
            querySnapshot = await db.collection("customers")
                .where('phone', '==', phone)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
        }
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            if (!data) return null;

            // Handle mixed storage patterns
            const dataForValidation: any = {
                ...data,
                // Use existing customerId if present, otherwise use document ID
                customerId: data.customerId || doc.id,
            };
            
            // Only add timestamp fields if they exist (avoid undefined)
            if (data.createdAt) {
                dataForValidation.createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
            }
            if (data.updatedAt) {
                dataForValidation.updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt;
            }
            if (data.lastOrderAt) {
                dataForValidation.lastOrderAt = data.lastOrderAt?.toDate ? data.lastOrderAt.toDate().toISOString() : data.lastOrderAt;
            }
            if (data.lastInteractionAt) {
                dataForValidation.lastInteractionAt = data.lastInteractionAt?.toDate ? data.lastInteractionAt.toDate().toISOString() : data.lastInteractionAt;
            }
            if (data.inactiveSince) {
                dataForValidation.inactiveSince = data.inactiveSince?.toDate ? data.inactiveSince.toDate().toISOString() : data.inactiveSince;
            }

            const validation = CustomerSchema.safeParse(dataForValidation);
            if (validation.success) {
                console.log(`[OMS][CUSTOMER_UTILS] Found customer: ${validation.data.customerId}`);
                return validation.data;
            } else {
                console.error(`[OMS][CUSTOMER_UTILS] Invalid customer data for phone ${phone}:`, validation.error.flatten());
                console.error(`[OMS][CUSTOMER_UTILS] Failed data:`, JSON.stringify(dataForValidation, null, 2));
                // Return null so the function continues to try legacy lookup
                return null;
            }
        }
        
        // Method 2: Fallback for legacy customers stored with phone as document ID
        try {
            const phoneDoc = await db.collection("customers").doc(phone).get();
            if (phoneDoc.exists) {
                const data = phoneDoc.data();
                if (data) {
                    const dataForValidation: any = {
                        ...data,
                        customerId: data.customerId || phoneDoc.id,
                    };
                    
                    // Only add timestamp fields if they exist
                    if (data.createdAt) {
                        dataForValidation.createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
                    }
                    if (data.updatedAt) {
                        dataForValidation.updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt;
                    }
                    if (data.lastOrderAt) {
                        dataForValidation.lastOrderAt = data.lastOrderAt?.toDate ? data.lastOrderAt.toDate().toISOString() : data.lastOrderAt;
                    }
                    if (data.lastInteractionAt) {
                        dataForValidation.lastInteractionAt = data.lastInteractionAt?.toDate ? data.lastInteractionAt.toDate().toISOString() : data.lastInteractionAt;
                    }
                    if (data.inactiveSince) {
                        dataForValidation.inactiveSince = data.inactiveSince?.toDate ? data.inactiveSince.toDate().toISOString() : data.inactiveSince;
                    }

                    const validation = CustomerSchema.safeParse(dataForValidation);
                    if (validation.success) {
                        console.log(`[OMS][CUSTOMER_UTILS] Found legacy customer stored by phone: ${phone}`);
                        return validation.data;
                    }
                }
            }
        } catch (legacyError: any) {
            console.warn(`[OMS][CUSTOMER_UTILS] Legacy lookup failed for ${phone}:`, legacyError.message);
        }
        
        return null;
    } catch (error: any) {
        console.error(`[OMS][CUSTOMER_UTILS] Error fetching customer ${phone}:`, error.message);
        return null;
    }
}

export async function createOrUpdateCustomer(
    phone: string, 
    data: Partial<Omit<Customer, 'customerId' | 'createdAt' | 'updatedAt'>> & { customerId?: string },
    shippingAddress?: { street: string; city: string; state: string; zip: string; country: string; }
): Promise<Customer> {
    // Normalize phone number FIRST before any lookups
    const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
    console.log(`[CUSTOMER_UTILS] createOrUpdateCustomer called with phone: ${phone} (normalized: ${normalizedPhone})`);
    
    // First try to find existing customer by phone
    const existingCustomer = await getCustomerByPhone(normalizedPhone);
    let customerRef;
    let isNewCustomer = false;
    
    if (existingCustomer) {
        console.log(`[CUSTOMER_UTILS] Found existing customer: ${existingCustomer.customerId}`);
        // For existing customers, we need to determine the correct document reference
        // Check if customer is stored by customerId (new pattern) or phone (legacy pattern)
        const customerIdDoc = await db.collection("customers").doc(existingCustomer.customerId).get();
        const phoneDoc = await db.collection("customers").doc(normalizedPhone).get();
        
        if (customerIdDoc.exists) {
            // Customer is stored by customerId (new pattern)
            customerRef = db.collection("customers").doc(existingCustomer.customerId);
            console.log(`[CUSTOMER_UTILS] Using existing customer document: ${existingCustomer.customerId}`);
        } else if (phoneDoc.exists) {
            // Customer is stored by phone (legacy pattern)
            customerRef = db.collection("customers").doc(normalizedPhone);
            console.log(`[CUSTOMER_UTILS] Using legacy customer document: ${normalizedPhone}`);
        } else {
            // This shouldn't happen, but fallback to customerId
            customerRef = db.collection("customers").doc(existingCustomer.customerId);
            console.log(`[CUSTOMER_UTILS] Fallback to customerId: ${existingCustomer.customerId}`);
        }
    } else {
        console.log(`[CUSTOMER_UTILS] No existing customer found, creating new one`);
        // Create new customer with generated customerId (new pattern)
        const newCustomerId = `CUS_${Date.now()}`;
        customerRef = db.collection("customers").doc(newCustomerId);
        isNewCustomer = true;
    }

    try {
        const doc = await customerRef.get();
        
        if (!doc.exists) {
            console.log(`[OMS][CUSTOMER_UTILS] Creating new customer: ${normalizedPhone}`);
            // Use the document ID as customerId for new customers
            const newCustomerId = customerRef.id;
            
            const defaults = {
                totalOrders: 0, totalSpent: 0, trustScore: 50, avgOrderValue: 0,
                refundsCount: 0, returnRate: 0, lifetimeValue: 0, savedAddresses: [],
                loyaltyTier: "new", isDubious: false
            };

            // Handle address for new customer
            let addressData = {};
            if (shippingAddress) {
                // For new customers, set default address and add to savedAddresses
                addressData = {
                    defaultAddress: shippingAddress,
                    savedAddresses: [shippingAddress] // Add first address to address book
                };
                console.log(`[OMS][CUSTOMER_UTILS] Added initial address to new customer's address book`);
            }

            const newCustomerObject = {
                ...defaults,
                ...data,
                ...addressData,
                customerId: newCustomerId,
                phone: normalizedPhone,
            };

            // Remove date fields before validation, as they are handled by the server.
            const { createdAt, updatedAt, ...dataForValidation } = newCustomerObject as any;

            const validation = CustomerSchema.partial().safeParse(dataForValidation);
            if (!validation.success) {
                console.error("[OMS][CUSTOMER_UTILS] Zod validation failed for new customer:", validation.error.flatten());
                console.error("[OMS][CUSTOMER_UTILS] Failed data:", JSON.stringify(dataForValidation, null, 2));
                throw new Error(`New customer data validation failed: ${JSON.stringify(validation.error.flatten())}`);
            }

            await customerRef.set({
                ...validation.data,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Return the created customer data directly (avoiding re-fetch validation issues)
            const createdCustomerData = {
                ...validation.data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            return createdCustomerData as Customer;

        } else {
            console.log(`[OMS][CUSTOMER_UTILS] Updating existing customer: ${normalizedPhone}`);
            
            const existingCustomer = doc.data() as Customer;
            
            // Build update data carefully - only include fields that are explicitly provided
            let updateData: any = { 
                phone: normalizedPhone // Always ensure phone is in normalized format
            };
            
            // Only update fields that are explicitly provided in data parameter
            if (data.name !== undefined) updateData.name = data.name;
            if (data.email !== undefined) updateData.email = data.email;
            if (data.preferredLanguage !== undefined) updateData.preferredLanguage = data.preferredLanguage;
            if (data.whatsappOptIn !== undefined) updateData.whatsappOptIn = data.whatsappOptIn;
            
            // Preserve customerId - use existing customerId or fallback to document ID
            updateData.customerId = existingCustomer.customerId || customerRef.id;
            
            // Handle address updates for existing customer
            if (shippingAddress) {
                // Normalize the address - remove any label field if it exists in existing address
                // This ensures consistency between order addresses and customer addresses
                const normalizedAddress = {
                    street: shippingAddress.street,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    zip: shippingAddress.zip,
                    country: shippingAddress.country
                };
                
                // Update default address
                updateData.defaultAddress = normalizedAddress;
                
                // Also add to savedAddresses if it's not already there
                const savedAddresses = existingCustomer.savedAddresses || [];
                const addressExists = savedAddresses.some(addr => addressesEqual(addr, normalizedAddress));
                
                if (!addressExists) {
                    updateData.savedAddresses = [...savedAddresses, normalizedAddress];
                    console.log(`[OMS][CUSTOMER_UTILS] Added new address to savedAddresses for customer ${normalizedPhone}`);
                } else {
                    console.log(`[OMS][CUSTOMER_UTILS] Address already exists in savedAddresses for customer ${normalizedPhone}`);
                }
                
                console.log(`[OMS][CUSTOMER_UTILS] Updated default address for customer ${normalizedPhone}`);
            }
           
            // Filter out undefined values and fields that shouldn't be updated
            const cleanUpdateData = Object.fromEntries(
                Object.entries(updateData).filter(([key, value]) => {
                    // Skip undefined values
                    if (value === undefined) return false;
                    // Skip fields that are managed separately
                    if (['createdAt', 'updatedAt'].includes(key)) return false;
                    return true;
                })
            );
            
            console.log(`[OMS][CUSTOMER_UTILS] Applying update with fields: ${Object.keys(cleanUpdateData).join(', ')}`);
            
            // Apply the update, server handles the timestamp.
            await customerRef.update({
                ...cleanUpdateData,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            // Return the updated customer data directly (avoiding re-fetch validation issues)
            const updatedCustomerData = {
                ...existingCustomer,
                ...updateData,
                updatedAt: new Date().toISOString() // Use current timestamp for return
            };
            
            // Update local cache immediately (write-through)
            try {
                const { updateSingleCustomerInCache } = await import('@/lib/cache/customerCache');
                updateSingleCustomerInCache(updatedCustomerData as Customer);
            } catch (cacheError) {
                console.warn('[CUSTOMER_UTILS] Cache update failed:', cacheError);
                // Don't fail the operation if cache update fails
            }
            
            return updatedCustomerData as Customer;
        }

    } catch (error: any) {
        console.error(`[OMS][CUSTOMER_UTILS] CRITICAL ERROR saving customer ${normalizedPhone}:`, error);
        throw error;
    }
}


// No changes to the other functions
export async function updateCustomerMetrics(phone: string, updates: { [key in keyof Customer]?: number }): Promise<void> {
    const customer = await getCustomerByPhone(phone);
    if (!customer) {
        console.error(`[OMS][CUSTOMER_UTILS] Customer not found for metrics update: ${phone}`);
        return;
    }
    
    // Determine correct document reference (handle mixed storage)
    let customerRef;
    const customerIdDoc = await db.collection("customers").doc(customer.customerId).get();
    const phoneDoc = await db.collection("customers").doc(phone).get();
    
    if (customerIdDoc.exists) {
        customerRef = db.collection("customers").doc(customer.customerId);
    } else if (phoneDoc.exists) {
        customerRef = db.collection("customers").doc(phone);
    } else {
        console.error(`[OMS][CUSTOMER_UTILS] Could not find document for customer: ${phone}`);
        return;
    }
    
    try {
        const updatePayload: { [key: string]: any } = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        for (const key in updates) {
            if (typeof updates[key as keyof Customer] === 'number') {
                updatePayload[key] = admin.firestore.FieldValue.increment(updates[key as keyof Customer] as number);
            }
        }
        await customerRef.update(updatePayload);
    } catch (error: any) {
        console.error(`[OMS][CUSTOMER_UTILS] Error updating metrics for ${phone}:`, error.message);
    }
}

export async function recalculateTrustScore(phone: string, orderStatus: "delivered" | "cancelled"): Promise<void> {
    const customer = await getCustomerByPhone(phone);
    if (!customer) return;
    
    let scoreChange = 0;
    if (orderStatus === "delivered") scoreChange = 2;
    else if (orderStatus === "cancelled") scoreChange = -5;
    const newTrustScore = Math.max(0, Math.min(100, customer.trustScore + scoreChange));
    
    if (newTrustScore !== customer.trustScore) {
        // Determine correct document reference (handle mixed storage)
        let customerRef;
        const customerIdDoc = await db.collection("customers").doc(customer.customerId).get();
        const phoneDoc = await db.collection("customers").doc(phone).get();
        
        if (customerIdDoc.exists) {
            customerRef = db.collection("customers").doc(customer.customerId);
        } else if (phoneDoc.exists) {
            customerRef = db.collection("customers").doc(phone);
        } else {
            console.error(`[OMS][CUSTOMER_UTILS] Could not find document for trust score update: ${phone}`);
            return;
        }
        
        await customerRef.update({
            trustScore: newTrustScore,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
}

export async function updateLoyaltyTier(phone: string): Promise<void> {
    const customer = await getCustomerByPhone(phone);
    if (!customer) return;
    
    const totalOrders = customer.totalOrders;
    let newTier: Customer['loyaltyTier'] = "new";
    if (totalOrders >= 26) newTier = "platinum";
    else if (totalOrders >= 11) newTier = "gold";
    else if (totalOrders >= 3) newTier = "repeat";
    
    if (newTier !== customer.loyaltyTier) {
        // Determine correct document reference (handle mixed storage)
        let customerRef;
        const customerIdDoc = await db.collection("customers").doc(customer.customerId).get();
        const phoneDoc = await db.collection("customers").doc(phone).get();
        
        if (customerIdDoc.exists) {
            customerRef = db.collection("customers").doc(customer.customerId);
        } else if (phoneDoc.exists) {
            customerRef = db.collection("customers").doc(phone);
        } else {
            console.error(`[OMS][CUSTOMER_UTILS] Could not find document for loyalty tier update: ${phone}`);
            return;
        }
        
        await customerRef.update({
            loyaltyTier: newTier,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
}

/**
 * Add a new address to customer's address book
 */
export async function addCustomerAddress(
    phone: string, 
    address: { street: string; city: string; state: string; zip: string; country: string; },
    setAsDefault: boolean = false
): Promise<{ success: boolean; message: string; }> {
    try {
        const customer = await getCustomerByPhone(phone);
        if (!customer) {
            return { success: false, message: 'Customer not found' };
        }

        const savedAddresses = customer.savedAddresses || [];
        const addressExists = savedAddresses.some(addr => addressesEqual(addr, address));
        
        if (addressExists) {
            return { success: false, message: 'Address already exists in address book' };
        }
        
        let updateData: any = {
            savedAddresses: [...savedAddresses, address]
        };
        
        if (setAsDefault) {
            updateData.defaultAddress = address;
        }
        
        // Determine correct document reference
        let customerRef;
        const customerIdDoc = await db.collection("customers").doc(customer.customerId).get();
        const phoneDoc = await db.collection("customers").doc(phone).get();
        
        if (customerIdDoc.exists) {
            customerRef = db.collection("customers").doc(customer.customerId);
        } else if (phoneDoc.exists) {
            customerRef = db.collection("customers").doc(phone);
        } else {
            return { success: false, message: 'Customer document not found' };
        }
        
        await customerRef.update({
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`[OMS][CUSTOMER_UTILS] Added new address to customer ${phone}`);
        return { success: true, message: 'Address added successfully' };
        
    } catch (error: any) {
        console.error(`[OMS][CUSTOMER_UTILS] Error adding address for ${phone}:`, error.message);
        return { success: false, message: 'Failed to add address' };
    }
}

/**
 * Update an existing address in customer's address book
 */
export async function updateCustomerAddress(
    phone: string, 
    oldAddress: { street: string; city: string; state: string; zip: string; country: string; },
    newAddress: { street: string; city: string; state: string; zip: string; country: string; },
    setAsDefault: boolean = false
): Promise<{ success: boolean; message: string; }> {
    try {
        const customer = await getCustomerByPhone(phone);
        if (!customer) {
            return { success: false, message: 'Customer not found' };
        }

        const savedAddresses = customer.savedAddresses || [];
        const addressIndex = savedAddresses.findIndex(addr => addressesEqual(addr, oldAddress));
        
        if (addressIndex === -1) {
            return { success: false, message: 'Original address not found in address book' };
        }
        
        // Check if new address already exists (and it's not the same address being updated)
        const newAddressExists = savedAddresses.some((addr, index) => 
            index !== addressIndex && addressesEqual(addr, newAddress)
        );
        
        if (newAddressExists) {
            return { success: false, message: 'New address already exists in address book' };
        }
        
        // Update the address
        const updatedAddresses = [...savedAddresses];
        updatedAddresses[addressIndex] = newAddress;
        
        let updateData: any = {
            savedAddresses: updatedAddresses
        };
        
        // Update default address if it was the old address or if explicitly requested
        if (setAsDefault || addressesEqual(customer.defaultAddress, oldAddress)) {
            updateData.defaultAddress = newAddress;
        }
        
        // Determine correct document reference
        let customerRef;
        const customerIdDoc = await db.collection("customers").doc(customer.customerId).get();
        const phoneDoc = await db.collection("customers").doc(phone).get();
        
        if (customerIdDoc.exists) {
            customerRef = db.collection("customers").doc(customer.customerId);
        } else if (phoneDoc.exists) {
            customerRef = db.collection("customers").doc(phone);
        } else {
            return { success: false, message: 'Customer document not found' };
        }
        
        await customerRef.update({
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`[OMS][CUSTOMER_UTILS] Updated address for customer ${phone}`);
        return { success: true, message: 'Address updated successfully' };
        
    } catch (error: any) {
        console.error(`[OMS][CUSTOMER_UTILS] Error updating address for ${phone}:`, error.message);
        return { success: false, message: 'Failed to update address' };
    }
}

/**
 * Remove an address from customer's address book
 */
export async function removeCustomerAddress(
    phone: string, 
    address: { street: string; city: string; state: string; zip: string; country: string; }
): Promise<{ success: boolean; message: string; }> {
    try {
        const customer = await getCustomerByPhone(phone);
        if (!customer) {
            return { success: false, message: 'Customer not found' };
        }

        const savedAddresses = customer.savedAddresses || [];
        const addressIndex = savedAddresses.findIndex(addr => addressesEqual(addr, address));
        
        if (addressIndex === -1) {
            return { success: false, message: 'Address not found in address book' };
        }
        
        // Remove the address
        const updatedAddresses = savedAddresses.filter((_, index) => index !== addressIndex);
        
        let updateData: any = {
            savedAddresses: updatedAddresses
        };
        
        // If this was the default address, clear it or set to first available address
        if (addressesEqual(customer.defaultAddress, address)) {
            updateData.defaultAddress = updatedAddresses.length > 0 ? updatedAddresses[0] : null;
        }
        
        // Determine correct document reference
        let customerRef;
        const customerIdDoc = await db.collection("customers").doc(customer.customerId).get();
        const phoneDoc = await db.collection("customers").doc(phone).get();
        
        if (customerIdDoc.exists) {
            customerRef = db.collection("customers").doc(customer.customerId);
        } else if (phoneDoc.exists) {
            customerRef = db.collection("customers").doc(phone);
        } else {
            return { success: false, message: 'Customer document not found' };
        }
        
        await customerRef.update({
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`[OMS][CUSTOMER_UTILS] Removed address from customer ${phone}`);
        return { success: true, message: 'Address removed successfully' };
        
    } catch (error: any) {
        console.error(`[OMS][CUSTOMER_UTILS] Error removing address for ${phone}:`, error.message);
        return { success: false, message: 'Failed to remove address' };
    }
}

/**
 * Set default address for customer
 */
export async function setDefaultAddress(
    phone: string, 
    address: { street: string; city: string; state: string; zip: string; country: string; }
): Promise<{ success: boolean; message: string; }> {
    try {
        const customer = await getCustomerByPhone(phone);
        if (!customer) {
            return { success: false, message: 'Customer not found' };
        }

        const savedAddresses = customer.savedAddresses || [];
        const addressExists = savedAddresses.some(addr => addressesEqual(addr, address));
        
        if (!addressExists) {
            return { success: false, message: 'Address not found in address book' };
        }
        
        // Determine correct document reference
        let customerRef;
        const customerIdDoc = await db.collection("customers").doc(customer.customerId).get();
        const phoneDoc = await db.collection("customers").doc(phone).get();
        
        if (customerIdDoc.exists) {
            customerRef = db.collection("customers").doc(customer.customerId);
        } else if (phoneDoc.exists) {
            customerRef = db.collection("customers").doc(phone);
        } else {
            return { success: false, message: 'Customer document not found' };
        }
        
        await customerRef.update({
            defaultAddress: address,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`[OMS][CUSTOMER_UTILS] Set default address for customer ${phone}`);
        return { success: true, message: 'Default address updated successfully' };
        
    } catch (error: any) {
        console.error(`[OMS][CUSTOMER_UTILS] Error setting default address for ${phone}:`, error.message);
        return { success: false, message: 'Failed to set default address' };
    }
}
