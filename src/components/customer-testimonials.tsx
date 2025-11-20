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
