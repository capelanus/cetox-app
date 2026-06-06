import type { NextConfig } from 'next'

// CSP — Next.js streaming + Turbopack require 'unsafe-inline' and 'unsafe-eval'
// for scripts and styles. Allow Vercel Blob storage (images/files) and Google Fonts.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://*.vercel-storage.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.public.blob.vercel-storage.com https://*.vercel-storage.com",
  "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  { key: 'Strict-Transport-Security',   value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options',             value: 'DENY' },
  { key: 'X-Content-Type-Options',      value: 'nosniff' },
  { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy',     value: cspDirectives },
  { key: 'Cross-Origin-Opener-Policy',  value: 'same-origin' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        source: '/login',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ]
  },
}

export default nextConfig
