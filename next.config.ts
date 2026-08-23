import type { NextConfig } from 'next'
import withBundleAnalyzerInit from '@next/bundle-analyzer'

const nextConfig: NextConfig = {
  devIndicators: false,
  // pdf-parse reads files from disk — must run in Node.js runtime, not Edge
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    // Tree-shake large icon + animation libraries — reduces shared JS chunk
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

// ANALYZE=true npm run build — opens an interactive treemap of what's in
// each bundle (client/server/edge) after the build finishes.
const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
})

export default withBundleAnalyzer(nextConfig)
