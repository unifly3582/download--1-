import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#2F6A3A',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F5EAD5',
          borderRadius: '6px',
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M11 20A7 7 0 0 1 4 13H2a10 10 0 0 0 10 10z"/>
          <path d="M12 2a7 7 0 0 1 7 7h2a10 10 0 0 0-10-9zM2 12a10 10 0 0 0 10 10V13a7 7 0 0 1-7-7z"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
