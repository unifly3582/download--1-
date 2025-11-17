# Customer Testimonials Feature

This feature allows you to manage YouTube testimonial videos that can be displayed on your customer-facing website.

## Admin Dashboard

Access the testimonials management page at: `/testimonials`

### Features:
- Add new testimonial videos with YouTube video IDs
- Edit existing testimonials
- Delete testimonials
- Toggle active/inactive status
- Set display order (lower numbers appear first)
- Filter by active/inactive/all testimonials

### Adding a Testimonial:

1. Click "Add Testimonial" button
2. Enter the YouTube Video ID (from the URL: `youtube.com/watch?v=VIDEO_ID`)
3. Enter customer name and location
4. Optionally add a title and description
5. Set display order (0 = highest priority)
6. Toggle active status
7. Click "Create Testimonial"

## Customer-Facing API

### Endpoint: `GET /api/customer/testimonials`

Fetches active testimonials for display on your customer website.

#### Query Parameters:
- `limit` (optional): Number of testimonials to fetch (default: 10, max: 50)

#### Example Request:
```bash
GET /api/customer/testimonials?limit=6
```

#### Example Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "testimonial123",
      "youtubeVideoId": "dQw4w9WgXcQ",
      "customerName": "John Doe",
      "customerLocation": "Mumbai, India",
      "title": "Amazing Product Quality",
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

## Frontend Integration Example

### React Component Example:

```tsx
'use client';

import { useState, useEffect } from 'react';

interface Testimonial {
  id: string;
  youtubeVideoId: string;
  customerName: string;
  customerLocation: string;
  title?: string;
  description?: string;
  thumbnailUrl: string;
  embedUrl: string;
  watchUrl: string;
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer/testimonials?limit=6')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTestimonials(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading testimonials...</div>;

  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold text-center mb-8">
        What Our Customers Say
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* YouTube Embed */}
            <div className="aspect-video">
              <iframe
                src={testimonial.embedUrl}
                title={testimonial.title || `Testimonial from ${testimonial.customerName}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            
            {/* Customer Info */}
            <div className="p-4">
              <h3 className="font-semibold text-lg">{testimonial.customerName}</h3>
              <p className="text-sm text-gray-600">{testimonial.customerLocation}</p>
              {testimonial.title && (
                <p className="mt-2 font-medium">{testimonial.title}</p>
              )}
              {testimonial.description && (
                <p className="mt-1 text-sm text-gray-700">{testimonial.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

### Simple HTML/JavaScript Example:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Customer Testimonials</title>
  <style>
    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    .testimonial-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .video-container {
      position: relative;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      height: 0;
    }
    .video-container iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    .testimonial-info {
      padding: 15px;
    }
  </style>
</head>
<body>
  <h1>Customer Testimonials</h1>
  <div id="testimonials" class="testimonials-grid"></div>

  <script>
    fetch('/api/customer/testimonials?limit=6')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const container = document.getElementById('testimonials');
          data.data.forEach(testimonial => {
            const card = document.createElement('div');
            card.className = 'testimonial-card';
            card.innerHTML = `
              <div class="video-container">
                <iframe 
                  src="${testimonial.embedUrl}" 
                  frameborder="0" 
                  allowfullscreen
                ></iframe>
              </div>
              <div class="testimonial-info">
                <h3>${testimonial.customerName}</h3>
                <p>${testimonial.customerLocation}</p>
                ${testimonial.title ? `<p><strong>${testimonial.title}</strong></p>` : ''}
                ${testimonial.description ? `<p>${testimonial.description}</p>` : ''}
              </div>
            `;
            container.appendChild(card);
          });
        }
      });
  </script>
</body>
</html>
```

## Database Structure

### Collection: `testimonials`

```typescript
{
  id: string;                    // Auto-generated document ID
  youtubeVideoId: string;        // YouTube video ID
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

## Security

- Admin API endpoints (`/api/admin/testimonials`) require authentication
- Customer API endpoint (`/api/customer/testimonials`) is public but only returns active testimonials
- Firestore rules allow public read access but no client-side writes
- All mutations must go through the secure backend API

## Tips

1. **YouTube Video ID**: Get it from the URL after `v=` parameter
   - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → Video ID is `dQw4w9WgXcQ`

2. **Display Order**: Use this to control the order testimonials appear
   - 0 = highest priority (appears first)
   - Higher numbers appear later

3. **Active Status**: Only active testimonials are returned by the customer API

4. **Thumbnail URLs**: The API automatically generates thumbnail URLs for convenience
