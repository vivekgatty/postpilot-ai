import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PostPika — AI LinkedIn Posts for Indian Professionals'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const fontBold = await fetch(
    'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2'
  ).then((res) => res.arrayBuffer())

  const fontRegular = await fetch(
    'https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrJJfecg.woff2'
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0A2540',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Poppins, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(29,158,117,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(29,158,117,0.08) 0%, transparent 40%)',
          }}
        />

        {/* Logo group — top third */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '48px',
          }}
        >
          {/* Pika SVG icon at 96px */}
          <svg
            width="96"
            height="96"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="12.5" cy="10" rx="6" ry="8.5" fill="#1D9E75" />
            <ellipse cx="27.5" cy="10" rx="6" ry="8.5" fill="#1D9E75" />
            <ellipse cx="12.5" cy="10.5" rx="3.2" ry="5.2" fill="#178a64" />
            <ellipse cx="27.5" cy="10.5" rx="3.2" ry="5.2" fill="#178a64" />
            <circle cx="20" cy="25" r="14" fill="#1D9E75" />
            <circle cx="14.5" cy="22.5" r="3" fill="white" />
            <circle cx="25.5" cy="22.5" r="3" fill="white" />
            <circle cx="15.2" cy="23.2" r="1.5" fill="#0A2540" />
            <circle cx="26.2" cy="23.2" r="1.5" fill="#0A2540" />
            <circle cx="15.8" cy="22.5" r="0.6" fill="white" />
            <circle cx="26.8" cy="22.5" r="0.6" fill="white" />
            <ellipse cx="20" cy="27.5" rx="1.8" ry="1.2" fill="#0A2540" opacity="0.5" />
            <ellipse cx="11.5" cy="27" rx="3" ry="1.8" fill="#fb7185" opacity="0.3" />
            <ellipse cx="28.5" cy="27" rx="3" ry="1.8" fill="#fb7185" opacity="0.3" />
          </svg>

          {/* Wordmark */}
          <span
            style={{
              fontSize: '72px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-1px',
              lineHeight: 1,
            }}
          >
            postpika
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: '900px',
            marginBottom: '20px',
          }}
        >
          Write viral LinkedIn posts
          <br />
          <span style={{ color: '#1D9E75' }}>in 30 seconds.</span>
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: '24px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            marginBottom: '64px',
          }}
        >
          AI-powered · Built for Indian professionals
        </div>

        {/* Teal bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '72px',
            background: '#1D9E75',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '26px',
              fontWeight: 600,
              color: 'white',
              letterSpacing: '0.5px',
            }}
          >
            postpika.com · Free to start
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Poppins', data: fontRegular, weight: 400 },
        { name: 'Poppins', data: fontBold, weight: 700 },
      ],
    }
  )
}
