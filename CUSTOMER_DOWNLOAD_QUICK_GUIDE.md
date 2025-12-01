# Customer Download - Quick Start Guide

## 🚀 Quick Start

### Step 1: Open the Download Dialog
1. Go to the **Customers** page
2. Click the **"Download Customers"** button in the top toolbar (next to "Add Customer")

### Step 2: Wait for Data to Load
- The system will automatically fetch all customers
- Progress updates will show: "Loaded X customers"
- This may take a few seconds depending on your customer count

### Step 3: Apply Filters (Optional)
Choose any combination of filters:

#### By Customer Value
- **Min Total Spent**: e.g., `5000` (customers who spent at least ₹5,000)
- **Max Total Spent**: e.g., `50000` (customers who spent up to ₹50,000)

#### By Location
- **State**: Select from dropdown (e.g., Maharashtra, Karnataka, etc.)

#### By Loyalty
- **Loyalty Tier**: Bronze, Silver, Gold, or Platinum

#### By Activity
- **Min Number of Orders**: e.g., `3` (customers with at least 3 orders)
- **Last Order Within**: e.g., `30` (customers who ordered in last 30 days)

### Step 4: Review Filtered Results
- See the count update in real-time: "Filtered Results: X customers"
- The blue box shows how many customers match your filters

### Step 5: Download CSV
- Click **"Download CSV (X)"** button
- File will download automatically with name like: `customers_Gold_Maharashtra_2024-12-01.csv`

## 📊 Common Filter Scenarios

### Scenario 1: High-Value Customers in Mumbai
```
State: Maharashtra
Min Total Spent: 10000
Tier: Gold or Platinum
```

### Scenario 2: Recent Active Customers
```
Last Order Within: 30
Min Orders: 2
```

### Scenario 3: Customers Ready for Re-engagement
```
Min Total Spent: 3000
Last Order Within: 90
Min Orders: 1
```

### Scenario 4: VIP Customers Across India
```
Tier: Platinum
Min Total Spent: 25000
```

### Scenario 5: New Customers by State
```
State: Karnataka
Max Total Spent: 5000
Min Orders: 1
```

## 📋 CSV Output Fields

The downloaded CSV includes:
- Customer ID
- Name, Phone, Email
- Loyalty Tier & Segment
- Total Orders & Total Spent
- Last Order Date
- Complete Address (Street, City, State, Pincode)
- Region
- Account Created Date

## 💡 Pro Tips

1. **Start Broad, Then Narrow**: Apply one filter at a time to see the impact
2. **Clear Filters**: Use "Clear Filters" button to start over
3. **Refresh Data**: Click "Refresh Data" to get latest customer information
4. **Check Count**: Always check the filtered count before downloading
5. **Filename**: The CSV filename includes your filters for easy identification

## ⚠️ Important Notes

- All data is fetched and filtered locally in your browser
- No data is sent to external servers
- Maximum 10,000 customers can be loaded at once
- Filters are applied instantly without additional API calls
- The dialog can be closed and reopened without re-fetching data

## 🔧 Troubleshooting

### "No customers match the selected filters"
- Try relaxing some filters
- Click "Clear Filters" and start again
- Check if the filter values are realistic

### Data not loading
- Check your internet connection
- Refresh the page and try again
- Contact support if issue persists

### CSV not downloading
- Check browser download settings
- Ensure pop-ups are not blocked
- Try a different browser

## 🎯 Use Cases

### Marketing Campaigns
- Download customers by state for regional campaigns
- Filter by last order date to target dormant customers
- Export high-value customers for VIP offers

### Customer Analysis
- Analyze customer distribution by state
- Identify high-value customer segments
- Track customer lifecycle stages

### Operations
- Generate mailing lists by location
- Create targeted WhatsApp broadcast lists
- Segment customers for personalized communication

## 📞 Need Help?

If you encounter any issues or need additional filtering options, please contact the development team.
