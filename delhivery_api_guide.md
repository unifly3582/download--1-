# The Complete Guide to Creating Delhivery Orders via API

This guide provides a comprehensive, step-by-step walkthrough for creating a B2C shipment using the Delhivery API and the Postman application. It includes core concepts, setup, examples, and troubleshooting for common errors.

## Section 1: Core Concepts (Crucial Rules to Avoid Errors)

Before making any API calls, understanding these four rules will prevent 99% of common errors.

1.  **Use `form-data`, Not `raw` JSON:** The API expects the request body to be in a `form-data` format with two keys: `format` and `data`. Sending a raw JSON body will cause a `"format key missing"` error.

2.  **`orderid` Must Be New and Unique:** Every shipment you create **must** have a unique `orderid`. Reusing an ID will cause the request to fail. It should also be alphanumeric, without special characters.

3.  **`waybill` Must Be Empty for New Orders:** For all new forward shipments, the `waybill` field in your JSON payload **must** be an empty string (`""`). Delhivery's system generates this tracking number for you. Providing a used waybill will cause an error.

4.  **Follow Correct Data Formatting:**
    *   **Weight:** Must be in **Grams** (e.g., `500` for 0.5 kg).
    *   **Dimensions:** Must be in **Centimeters (cm)**.

---

## Section 2: Prerequisites

*   **Delhivery API Key (Token):** Found in your Delhivery client panel.
*   **Registered Pickup Location:** A warehouse registered in the Delhivery system. The `name` used in the API must be an *exact match* (it is case and space-sensitive).
*   **Postman:** The Postman desktop application.

---

## Section 3: Step-by-Step Postman Configuration

### 3.1: Set the Request Method and URL

*   **Method:** `POST`
*   **Staging URL (for testing):** `https://staging-express.delhivery.com/api/cmu/create.json`
*   **Production URL (for live orders):** `https://track.delhivery.com/api/cmu/create.json`

### 3.2: Set Up the Authentication Header

*   Navigate to the **Headers** tab.
*   Add a new header:
    *   **KEY:** `Authorization`
    *   **VALUE:** `Token YOUR_API_KEY` (Replace `YOUR_API_KEY` with your actual key).
*   **Important:** Do NOT add a `Content-Type` header. Postman sets it automatically when using `form-data`.

### 3.3: Set Up the Request Body

This is the most critical step.

*   Navigate to the **Body** tab.
*   Select the **`form-data`** radio button.
*   Create two key-value pairs in the table as shown below:

| KEY    | VALUE                                           |
| :----- | :---------------------------------------------- |
| `format` | `json`                                          |
| `data`   | *(You will paste your entire JSON payload here)* |

---

## Section 4: The JSON Payload

### 4.1: Complete JSON Template

Copy this template and paste it into the `VALUE` field of the `data` key in Postman.

```json
{
  "pickup_location": {
    "name": "karan kanjhawala"
  },
  "shipments": [
    {
      "name": "Customer Name",
      "add": "Customer's Full Address",
      "pin": "110001",
      "city": "New Delhi",
      "state": "Delhi",
      "country": "India",
      "phone": "9999988888",
      "orderid": "YourUniqueAlphanumericID123",
      "payment_mode": "Prepaid",
      "products_desc": "Description of items in the package",
      "hsn_code": "12345678",
      "cod_amount": "0",
      "total_amount": "1500",
      "quantity": "1",
      "weight": "500",
      "shipment_width": "15",
      "shipment_height": "10",
      "shipment_length": "20",
      "shipping_mode": "Surface",
      "waybill": ""
    }
  ]
}
```

### 4.2: Key Fields Explained
| Field | Requirement | Example |
| :--- | :--- | :--- |
| pickup_location.name | Mandatory. Must exactly match your registered warehouse name. | "karan kanjhawala" |
| orderid | Mandatory & Crucial. Must be a new, unique alphanumeric ID for every order. | "ORD100234" |
| payment_mode | Mandatory. Can be Prepaid, COD, or Pickup (for returns). | "COD" |
| cod_amount | The amount to collect for COD orders. Must be "0" for Prepaid orders. | "1499" |
| weight | Mandatory. The total weight of the package in Grams. | "500" (for 0.5 kg) |
| Dimensions (w, h, l) | The size of the package in Centimeters (cm). | "15" |
| waybill | Crucial. Must always be an empty string ("") for new forward orders. | "" |

## Section 5: Send the Request and Interpret the Response

Click the blue Send button in Postman.

### 5.1: Successful Response

A successful response indicates the order was created.

```json
{
    "success": true,
    "package_count": 1,
    "packages": [
        {
            "status": "Success",
            "waybill": "31232410020532",
            "payment": "Pre-paid"
        }
    ]
}
```

*   `"success": true`: Your request was successful.
*   `"waybill": "31232410020532"`: This is your official tracking number. Save this in your system against your `orderid`.

### 5.2: Failed Response

A failed response will have `"success": false` and an error message in the `rmk` or `remarks` field.

```json
{
    "success": false,
    "packages": [
        {
            "status": "Fail",
            "remarks": [
                "Crashing while saving package due to blanket exception 'Unable to consume 31232410020521...'"
            ],
            "waybill": "31232410020521"
        }
    ],
    "rmk": "An internal Error has occurred..."
}
```

## Section 6: Troubleshooting Common Errors
| Error Message in `rmk` or `remarks` | Cause | Solution |
| :--- | :--- | :--- |
| `"format key missing in POST"` | You sent the data as `raw` JSON instead of `form-data`. | Change the **Body** type in Postman to `form-data` (as shown in Section 3). |
| `"Unable to consume [waybill], Hint: Check if the right client..."` | You provided a `waybill` number that has already been used. | Ensure the `waybill` field in your JSON is an empty string: `""`. |
| `"Order ID already exists"` | You used an `orderid` that you have already used for a previous order. | Generate a new, unique `orderid` for every single request. |
| `"Invalid Pincode"` | The pincode you provided is not serviceable by Delhivery. | Check the pincode for typos or use Delhivery's Pincode Serviceability API. |
