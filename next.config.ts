import type { NextConfig } from 'next'
import withBundleAnalyzerInit from '@next/bundle-analyzer'

const isDev = process.env.NODE_ENV === 'development'

// Supabase origin(s) the browser talks to directly (auth calls from the
// login/signup/sign-out client code). Falls back to any *.supabase.co if
// the env var isn't present at build time.
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : 'https://*.supabase.co'
const supabaseWs = supabaseOrigin.startsWith('http')
  ? supabaseOrigin.replace(/^http/, 'ws')
  : 'wss://*.supabase.co'

// Next's App Router streams the RSC payload through inline <script> tags,
// so script-src needs 'unsafe-inline' (a nonce-based policy would need
// middleware-generated nonces on every request). Everything else is
// locked to same-origin + Supabase. 'unsafe-eval' is dev-only (React
// refresh / source maps).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs}${isDev ? ' ws://localhost:* http://localhost:*' : ''}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy',   value: csp },
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  // pdf-parse reads files from disk — must run in Node.js runtime, not Edge
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    // Tree-shake large icon + animation libraries — reduces shared JS chunk
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

// ANALYZE=true npm run build — opens an interactive treemap of what's in
// each bundle (client/server/edge) after the build finishes.
const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
})

export default withBundleAnalyzer(nextConfig)
