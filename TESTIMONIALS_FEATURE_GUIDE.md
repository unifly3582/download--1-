# YouTube Testimonials Feature - Complete Guide

## Overview

A complete feature to manage and display YouTube customer testimonial videos on your website. Includes admin dashboard for management and public API for customer-facing website.

## What Was Created

### 1. Database Types (`src/types/testimonial.ts`)
- `Testimonial` - Full testimonial object with all fields
- `CreateTestimonial` - Schema for creating new testimonials
- `UpdateTestimonial` - Schema for updating existing testimonials

### 2. Admin API Endpoints

#### `GET /api/admin/testimonials`
Fetch all testimonials (with optional filtering)
- Query params: `isActive` (true/false/null for all)
- Returns: Array of testimonials ordered by displayOrder and createdAt

#### `POST /api/admin/testimonials`
Create a new testimonial
- Body: CreateTestimonial object
- Returns: Created testimonial with ID

#### `GET /api/admin/testimonials/[testimonialId]`
Get a single testimonial by ID

#### `PATCH /api/admin/testimonials/[testimonialId]`
Update a testimonial
- Body: Partial UpdateTestimonial object

#### `DELETE /api/admin/testimonials/[testimonialId]`
Delete a testimonial permanently

### 3. Customer-Facing API

#### `GET /api/customer/testimonials`
Public endpoint to fetch active testimonials
- Query params: `limit` (default: 10, max: 50)
- Returns: Active testimonials with YouTube URLs pre-generated
- Response includes:
  - `thumbnailUrl` - YouTube thumbnail image
  - `embedUrl` - YouTube embed URL
  - `watchUrl` - YouTube watch URL

### 4. Admin Dashboard (`/testimonials`)

Features:
- View all testimonials in a table
- Filter by Active/Inactive/All
- Add new testimonials with dialog
- Edit existing testimonials
- Delete testimonials
- View videos directly on YouTube
- Manage display order

### 5. Database Security

Updated `firestore.rules`:
- Public read access to testimonials collection
- No client-side writes (all mutations through API)
- Admin-only management through authenticated endpoints

Updated `firestore.indexes.json`:
- Composite index for `isActive + displayOrder + createdAt`
- Composite index for `displayOrder + createdAt`

## How to Use

### Admin: Adding a Testimonial

1. Navigate to `/testimonials` in your admin dashboard
2. Click "Add Testimonial" button
3. Fill in the form:
   - **YouTube Video ID**: Get from URL (e.g., `youtube.com/watch?v=VIDEO_ID`)
   - **Customer Name**: Full name of the customer
   - **Location**: City, Country (e.g., "Mumbai, India")
   - **Title** (optional): Short title for the testimonial
   - **Description** (optional): Brief description
   - **Display Order**: Lower numbers appear first (0 = highest priority)
   - **Active**: Toggle to show/hide on customer website
4. Click "Create Testimonial"

### Admin: Managing Testimonials

- **Edit**: Click the three dots menu → Edit
- **Delete**: Click the three dots menu → Delete
- **View on YouTube**: Click the three dots menu → View on YouTube
- **Filter**: Use tabs to filter by Active/Inactive/All

### Customer Website: Displaying Testimonials

#### Example React Component:

```tsx
'use client';

import { useState, useEffect } from 'react';

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    fetch('/api/customer/testimonials?limit=6')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTestimonials(data.data);
        }
      });
  }, []);

  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold text-center mb-8">
        What Our Customers Say
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="aspect-video">
              <iframe
                src={testimonial.embedUrl}
                title={testimonial.title || `Testimonial from ${testimonial.customerName}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg">{testimonial.customerName}</h3>
              <p className="text-sm text-gray-600">{testimonial.customerLocation}</p>
              {testimonial.title && (
                <p className="mt-2 font-medium">{testimonial.title}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

#### Example HTML/JavaScript:

```html
<div id="testimonials" class="testimonials-grid"></div>

<script>
  fetch('/api/customer/testimonials?limit=6')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const container = document.getElementById('testimonials');
        data.data.forEach(testimonial => {
          const card = document.createElement('div');
          card.innerHTML = `
            <iframe src="${testimonial.embedUrl}" allowfullscreen></iframe>
            <h3>${testimonial.customerName}</h3>
            <p>${testimonial.customerLocation}</p>
          `;
          container.appendChild(card);
        });
      }
    });
</script>
```

## Database Structure

```typescript
{
  id: string;                    // Auto-generated
  youtubeVideoId: string;        // YouTube video ID (e.g., "dQw4w9WgXcQ")
  customerName: string;          // Customer's name
  customerLocation: string;      // Customer's location
  title?: string;                // Optional title
  description?: string;          // Optional description
  displayOrder: number;          // Display order (0 = first)
  isActive: boolean;             // Active status
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

## API Response Format

### Customer API Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "youtubeVideoId": "dQw4w9WgXcQ",
      "customerName": "John Doe",
      "customerLocation": "Mumbai, India",
      "title": "Amazing Product",
      "description": "I love this product!",
      "displayOrder": 0,
      "thumbnailUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "watchUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  ],
  "count": 1
}
```

## Tips & Best Practices

1. **YouTube Video ID**: 
   - From `youtube.com/watch?v=VIDEO_ID` → Use `VIDEO_ID`
   - From `youtu.be/VIDEO_ID` → Use `VIDEO_ID`

2. **Display Order**:
   - Use 0 for highest priority (appears first)
   - Increment by 10 (0, 10, 20...) to allow easy reordering

3. **Active Status**:
   - Only active testimonials appear on customer website
   - Use inactive status to temporarily hide testimonials

4. **Video Quality**:
   - Ensure videos are public or unlisted on YouTube
   - Private videos won't display on your website

5. **Performance**:
   - Limit testimonials to 6-12 on homepage
   - Use lazy loading for better performance
   - Consider using thumbnail images with click-to-play

## Next Steps

1. **Deploy Firestore Rules**: Run `firebase deploy --only firestore:rules`
2. **Deploy Firestore Indexes**: Run `firebase deploy --only firestore:indexes`
3. **Test Admin Dashboard**: Navigate to `/testimonials` and add a test testimonial
4. **Test Customer API**: Call `/api/customer/testimonials` and verify response
5. **Integrate Frontend**: Add testimonials section to your customer-facing website

## Troubleshooting

### Video Not Displaying
- Check if video is public/unlisted on YouTube
- Verify YouTube Video ID is correct
- Check browser console for iframe errors

### Testimonials Not Appearing
- Verify testimonial is marked as "Active"
- Check Firestore indexes are deployed
- Verify API endpoint is accessible

### Permission Errors
- Ensure Firestore rules are deployed
- Check admin authentication is working
- Verify API routes are properly configured

## Files Created

```
src/
├── types/
│   └── testimonial.ts
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── testimonials/
│   │   │       ├── route.ts
│   │   │       └── [testimonialId]/
│   │   │           └── route.ts
│   │   └── customer/
│   │       └── testimonials/
│   │           └── route.ts
│   └── (dashboard)/
│       └── testimonials/
│           ├── page.tsx
│           ├── create-testimonial-dialog.tsx
│           ├── edit-testimonial-dialog.tsx
│           └── README.md

Updated:
├── firestore.rules
├── firestore.indexes.json
└── TESTIMONIALS_FEATURE_GUIDE.md (this file)
```
