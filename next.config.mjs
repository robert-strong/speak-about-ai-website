/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable Next.js image optimization for better Core Web Vitals
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
      },
      {
        protocol: 'https',
        hostname: '*.ctfassets.net',
      },
      {
        protocol: 'https',
        hostname: 'sheets.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
    // Use modern formats for better compression
    formats: ['image/avif', 'image/webp'],
  },
  // Enable compression for better performance
  compress: true,
  // Configure headers for caching and compression
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=31536000',
          },
        ],
      },
      {
        source: '/speakers/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400',
          },
        ],
      },
    ]
  },
  // SEO redirects for workshops
  async redirects() {
    return [
      {
        source: '/workshops',
        destination: '/ai-workshops',
        permanent: true,
      },
      {
        source: '/workshops/:slug',
        destination: '/ai-workshops/:slug',
        permanent: true,
      },
      // Old year-stamped list -> evergreen ranked list
      {
        source: '/top-ai-speakers-2025',
        destination: '/top-ai-speakers',
        permanent: true,
      },
      // Consolidate duplicate industry pages (same speaker sets, competing URLs)
      {
        source: '/industries/technology-ai-keynote-speakers',
        destination: '/industries/technology-keynote-speakers',
        permanent: true,
      },
      {
        source: '/industries/leadership-business-keynote-speakers',
        destination: '/industries/leadership-business-strategy-ai-speakers',
        permanent: true,
      },
      {
        source: '/industries/sales-marketing-keynote-speakers',
        destination: '/industries/sales-marketing-ai-speakers',
        permanent: true,
      },
      {
        source: '/industries/industrial-automotive-keynote-speakers',
        destination: '/industries/automotive-ai-speakers',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
