'use client';

/**
 * Analytics Provider
 * Initializes analytics and tracks page views
 */

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview, GA_MEASUREMENT_ID } from '@/lib/monitoring/analytics';
import { trackWebVitals } from '@/lib/monitoring/performance';
import Script from 'next/script';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      pageview(url);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // Track web vitals on mount
    trackWebVitals();
  }, []);

  if (!GA_MEASUREMENT_ID) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      {children}
    </>
  );
}
