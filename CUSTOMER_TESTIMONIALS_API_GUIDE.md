# Customer Testimonials API - Integration Guide

## 🎯 Quick Overview

This guide shows how to integrate YouTube testimonial videos into your customer-facing website using the `/api/customer/testimonials` endpoint.

---

## 📡 API Endpoint

### GET `/api/customer/testimonials`

**Public endpoint** - No authentication required

#### Query Parameters:
- `limit` (optional): Number of testimonials to fetch
  - Default: 10
  - Maximum: 50
  - Example: `?limit=6`

#### Example Request:
```bash
GET https://yourdomain.com/api/customer/testimonials?limit=6
```

#### Example Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "youtubeVideoId": "dQw4w9WgXcQ",
      "customerName": "राजेश कुमार",
      "customerLocation": "मेरठ, उत्तर प्रदेश",
      "title": "Amazing Quality Aseel Chickens",
      "description": "Very happy with the health and growth",
      "displayOrder": 0,
      "thumbnailUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "watchUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  ],
  "count": 1
}
```

---

## 🚀 Implementation Examples

### Option 1: React/Next.js Component (Recommended)

Create: `src/components/customer-testimonials.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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

export function CustomerTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/customer/testimonials?limit=6')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTestimonials(data.data);
        } else {
          setError('Failed to load testimonials');
        }
      })
      .catch(() => setError('Failed to load testimonials'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading testimonials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null; // Don't show section if no testimonials
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            हमारे ग्राहक क्या कहते हैं
          </h2>
          <p className="text-xl text-gray-600">
            What Our Customers Say
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id} 
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* YouTube Video Embed */}
              <div className="relative aspect-video bg-gray-900">
                <iframe
                  src={testimonial.embedUrl}
                  title={testimonial.title || `Testimonial from ${testimonial.customerName}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  loading="lazy"
                />
              </div>
              
              {/* Customer Info */}
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-1">
                  {testimonial.customerName}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  📍 {testimonial.customerLocation}
                </p>
                
                {testimonial.title && (
                  <p className="font-semibold text-gray-800 mb-2">
                    {testimonial.title}
                  </p>
                )}
                
                {testimonial.description && (
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {testimonial.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Usage in your page:**
```tsx
import { CustomerTestimonials } from '@/components/customer-testimonials';

export default function HomePage() {
  return (
    <div>
      {/* Your other content */}
      <CustomerTestimonials />
      {/* More content */}
    </div>
  );
}
```

---

### Option 2: Simple HTML + JavaScript

Create: `testimonials.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Customer Testimonials</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f9fafb;
    }

    .testimonials-section {
      padding: 60px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .section-header {
      text-align: center;
      margin-bottom: 50px;
    }

    .section-header h2 {
      font-size: 2.5rem;
      color: #111827;
      margin-bottom: 10px;
    }

    .section-header p {
      font-size: 1.25rem;
      color: #6b7280;
    }

    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }

    .testimonial-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: box-shadow 0.3s;
    }

    .testimonial-card:hover {
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
    }

    .video-container {
      position: relative;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      height: 0;
      background: #000;
    }

    .video-container iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }

    .testimonial-info {
      padding: 20px;
    }

    .customer-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 5px;
    }

    .customer-location {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 15px;
    }

    .testimonial-title {
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }

    .testimonial-description {
      font-size: 0.875rem;
      color: #4b5563;
      line-height: 1.5;
    }

    .loading, .error {
      text-align: center;
      padding: 60px 20px;
      font-size: 1.125rem;
    }

    .loading {
      color: #6b7280;
    }

    .error {
      color: #dc2626;
    }

    @media (max-width: 768px) {
      .section-header h2 {
        font-size: 2rem;
      }
      
      .testimonials-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <section class="testimonials-section">
    <div class="section-header">
      <h2>हमारे ग्राहक क्या कहते हैं</h2>
      <p>What Our Customers Say</p>
    </div>
    
    <div id="testimonials-container">
      <div class="loading">Loading testimonials...</div>
    </div>
  </section>

  <script>
    // Fetch testimonials from API
    fetch('/api/customer/testimonials?limit=6')
      .then(response => response.json())
      .then(data => {
        const container = document.getElementById('testimonials-container');
        
        if (!data.success || data.data.length === 0) {
          container.innerHTML = '<div class="error">No testimonials available</div>';
          return;
        }

        // Create grid
        const grid = document.createElement('div');
        grid.className = 'testimonials-grid';

        // Add each testimonial
        data.data.forEach(testimonial => {
          const card = document.createElement('div');
          card.className = 'testimonial-card';
          
          card.innerHTML = `
            <div class="video-container">
              <iframe 
                src="${testimonial.embedUrl}" 
                title="${testimonial.title || 'Customer Testimonial'}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                loading="lazy"
              ></iframe>
            </div>
            <div class="testimonial-info">
              <div class="customer-name">${testimonial.customerName}</div>
              <div class="customer-location">📍 ${testimonial.customerLocation}</div>
              ${testimonial.title ? `<div class="testimonial-title">${testimonial.title}</div>` : ''}
              ${testimonial.description ? `<div class="testimonial-description">${testimonial.description}</div>` : ''}
            </div>
          `;
          
          grid.appendChild(card);
        });

        container.innerHTML = '';
        container.appendChild(grid);
      })
      .catch(error => {
        console.error('Error loading testimonials:', error);
        document.getElementById('testimonials-container').innerHTML = 
          '<div class="error">Failed to load testimonials</div>';
      });
  </script>
</body>
</html>
```

---

### Option 3: WordPress/PHP Integration

```php
<?php
// testimonials-section.php

function display_customer_testimonials() {
    $api_url = 'https://yourdomain.com/api/customer/testimonials?limit=6';
    
    // Fetch testimonials
    $response = wp_remote_get($api_url);
    
    if (is_wp_error($response)) {
        return '<p>Unable to load testimonials</p>';
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    if (!$data['success'] || empty($data['data'])) {
        return '';
    }
    
    $testimonials = $data['data'];
    
    ob_start();
    ?>
    
    <section class="testimonials-section">
        <div class="container">
            <h2 class="text-center">हमारे ग्राहक क्या कहते हैं</h2>
            <p class="text-center subtitle">What Our Customers Say</p>
            
            <div class="testimonials-grid">
                <?php foreach ($testimonials as $testimonial): ?>
                    <div class="testimonial-card">
                        <div class="video-wrapper">
                            <iframe 
                                src="<?php echo esc_url($testimonial['embedUrl']); ?>"
                                title="<?php echo esc_attr($testimonial['title'] ?? 'Customer Testimonial'); ?>"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen
                                loading="lazy"
                            ></iframe>
                        </div>
                        <div class="testimonial-info">
                            <h3><?php echo esc_html($testimonial['customerName']); ?></h3>
                            <p class="location">📍 <?php echo esc_html($testimonial['customerLocation']); ?></p>
                            
                            <?php if (!empty($testimonial['title'])): ?>
                                <p class="title"><?php echo esc_html($testimonial['title']); ?></p>
                            <?php endif; ?>
                            
                            <?php if (!empty($testimonial['description'])): ?>
                                <p class="description"><?php echo esc_html($testimonial['description']); ?></p>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
    
    <?php
    return ob_get_clean();
}

// Use in your template:
// echo display_customer_testimonials();
?>
```

---

## 🎨 Styling Tips

### Responsive Grid
```css
/* Mobile: 1 column */
@media (max-width: 767px) {
  .testimonials-grid {
    grid-template-columns: 1fr;
  }
}

/* Tablet: 2 columns */
@media (min-width: 768px) and (max-width: 1023px) {
  .testimonials-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  .testimonials-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Video Aspect Ratio (16:9)
```css
.video-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 = 9/16 = 0.5625 */
  height: 0;
  overflow: hidden;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

---

## 🔧 Advanced Features

### 1. Lazy Loading Videos

Only load videos when they come into view:

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';

function LazyVideo({ embedUrl, title }: { embedUrl: string; title: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={videoRef} className="aspect-video bg-gray-900">
      {isVisible ? (
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white">
          Loading...
        </div>
      )}
    </div>
  );
}
```

### 2. Show Thumbnail First (Click to Play)

```tsx
function ThumbnailVideo({ testimonial }: { testimonial: Testimonial }) {
  const [showVideo, setShowVideo] = useState(false);

  if (!showVideo) {
    return (
      <div 
        className="relative aspect-video cursor-pointer group"
        onClick={() => setShowVideo(true)}
      >
        <img 
          src={testimonial.thumbnailUrl} 
          alt={testimonial.customerName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video">
      <iframe
        src={`${testimonial.embedUrl}?autoplay=1`}
        title={testimonial.title || 'Testimonial'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}
```

### 3. Carousel/Slider View

Using Swiper.js:

```tsx
'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <Swiper
      modules={[Navigation, Pagination]}
      spaceBetween={24}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      breakpoints={{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }}
    >
      {testimonials.map((testimonial) => (
        <SwiperSlide key={testimonial.id}>
          {/* Your testimonial card */}
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
```

---

## 📊 Performance Tips

1. **Limit API Calls**: Fetch once and cache
2. **Lazy Load**: Use `loading="lazy"` on iframes
3. **Thumbnail First**: Show thumbnail, load video on click
4. **Optimize Images**: Use WebP format for thumbnails
5. **CDN**: YouTube handles video CDN automatically

---

## 🧪 Testing

### Test the API:
```bash
curl https://yourdomain.com/api/customer/testimonials?limit=3
```

### Test in Browser Console:
```javascript
fetch('/api/customer/testimonials?limit=6')
  .then(r => r.json())
  .then(console.log);
```

---

## 🚨 Error Handling

Always handle these cases:

1. **API Failure**: Show fallback message
2. **No Testimonials**: Hide section entirely
3. **Invalid Video ID**: YouTube will show error
4. **Slow Loading**: Show loading state

```tsx
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage />;
if (testimonials.length === 0) return null; // Hide section
```

---

## 📱 Mobile Optimization

```css
/* Stack on mobile */
@media (max-width: 640px) {
  .testimonial-card {
    margin-bottom: 20px;
  }
  
  .customer-name {
    font-size: 1rem;
  }
  
  .testimonial-description {
    font-size: 0.8rem;
  }
}
```

---

## ✅ Checklist

- [ ] API endpoint working: `/api/customer/testimonials`
- [ ] Videos display correctly on desktop
- [ ] Videos display correctly on mobile
- [ ] Loading state shows while fetching
- [ ] Error handling in place
- [ ] Lazy loading implemented (optional)
- [ ] Section hidden if no testimonials
- [ ] Bilingual text (Hindi + English)
- [ ] Responsive grid layout
- [ ] Videos are embeddable (not private)

---

## 🎯 Quick Start

1. Copy the React component code above
2. Save as `src/components/customer-testimonials.tsx`
3. Import in your homepage
4. Done! Testimonials will appear automatically

---

## 📞 Need Help?

- Check browser console for errors
- Verify API returns data: `/api/customer/testimonials`
- Ensure videos are public/unlisted on YouTube
- Check Firestore rules allow public read access

