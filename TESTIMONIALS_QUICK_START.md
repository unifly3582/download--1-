# Customer Testimonials - Quick Start Guide

## 🚀 3-Step Setup

### Step 1: Add Videos in Admin Dashboard
1. Go to `/testimonials` in your admin panel
2. Click "Add Testimonial"
3. Enter YouTube Video ID (from URL: `youtube.com/watch?v=VIDEO_ID`)
4. Fill in customer name and location
5. Click "Create Testimonial"

### Step 2: Use the Component
```tsx
// In your customer-facing page (e.g., homepage)
import { CustomerTestimonials } from '@/components/customer-testimonials';

export default function HomePage() {
  return (
    <div>
      <CustomerTestimonials />
    </div>
  );
}
```

### Step 3: Done! ✅
Videos will automatically appear on your website.

---

## 📡 API Endpoint

**GET** `/api/customer/testimonials?limit=6`

Returns active testimonials with YouTube embed URLs ready to use.

---

## 📁 Files Created

1. **Component**: `src/components/customer-testimonials.tsx`
   - Ready-to-use React component
   - Responsive grid layout
   - Bilingual (Hindi + English)

2. **HTML Example**: `public/testimonials-example.html`
   - Standalone HTML page
   - No framework needed
   - View at: `http://localhost:3000/testimonials-example.html`

3. **Full Guide**: `CUSTOMER_TESTIMONIALS_API_GUIDE.md`
   - Complete documentation
   - Advanced features
   - Multiple integration options

---

## 🎯 What You Get

```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│   [YouTube Video 1]     │  │   [YouTube Video 2]     │  │   [YouTube Video 3]     │
│                         │  │                         │  │                         │
├─────────────────────────┤  ├─────────────────────────┤  ├─────────────────────────┤
│ राजेश कुमार             │  │ सुरेश पटेल              │  │ महेश यादव              │
│ 📍 मेरठ, UP             │  │ 📍 जयपुर, Rajasthan     │  │ 📍 नागपुर, Maharashtra  │
│                         │  │                         │  │                         │
│ "Amazing quality!"      │  │ "Very satisfied"        │  │ "Highly recommend"      │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

## 🎨 Responsive Design

- **Desktop**: 3 columns
- **Tablet**: 2 columns
- **Mobile**: 1 column

---

## 🧪 Test It

### View the Example:
```
http://localhost:3000/testimonials-example.html
```

### Test the API:
```bash
curl http://localhost:3000/api/customer/testimonials?limit=3
```

### Test in Browser Console:
```javascript
fetch('/api/customer/testimonials?limit=6')
  .then(r => r.json())
  .then(console.log);
```

---

## 💡 Usage Examples

### React/Next.js
```tsx
import { CustomerTestimonials } from '@/components/customer-testimonials';

export default function HomePage() {
  return (
    <>
      <Hero />
      <CustomerTestimonials />
      <Products />
    </>
  );
}
```

### Plain HTML
```html
<!-- Copy code from public/testimonials-example.html -->
<script>
  fetch('/api/customer/testimonials?limit=6')
    .then(r => r.json())
    .then(data => {
      // Display testimonials
    });
</script>
```

### WordPress
```php
<?php
$response = wp_remote_get('https://yourdomain.com/api/customer/testimonials?limit=6');
$data = json_decode(wp_remote_retrieve_body($response), true);

foreach ($data['data'] as $testimonial) {
    // Display each testimonial
}
?>
```

---

## 🔑 Key Features

✅ **YouTube Integration** - No video storage needed  
✅ **Responsive Design** - Works on all devices  
✅ **Lazy Loading** - Fast page load  
✅ **Bilingual** - Hindi + English support  
✅ **Auto-Updates** - Add videos in admin, appear instantly  
✅ **SEO Friendly** - Proper titles and descriptions  

---

## 📱 Mobile Optimized

The component automatically adjusts for mobile:
- Single column layout
- Touch-friendly video controls
- Optimized font sizes
- Proper spacing

---

## 🎬 Video Requirements

1. **Upload to YouTube** (customer's account or yours)
2. **Set to Public or Unlisted** (not Private)
3. **Get Video ID** from URL
4. **Add in Admin Dashboard**

Example URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`  
Video ID: `dQw4w9WgXcQ`

---

## 🚨 Troubleshooting

**Videos not showing?**
- Check API: `/api/customer/testimonials`
- Verify videos are Active in admin
- Ensure videos are Public/Unlisted on YouTube

**Layout broken?**
- Check Tailwind CSS is installed
- Verify component imports correctly

**API error?**
- Check Firestore rules allow public read
- Verify Firebase is configured

---

## 📚 More Information

- **Full API Guide**: `CUSTOMER_TESTIMONIALS_API_GUIDE.md`
- **Admin Guide**: `src/app/(dashboard)/testimonials/README.md`
- **Type Definitions**: `src/types/testimonial.ts`

---

## ✨ That's It!

Your customer testimonials are ready to display. Just add videos in the admin panel and they'll appear automatically on your website!

**Questions?** Check the full guide or test the example HTML file.
