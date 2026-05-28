import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  // pdf-parse reads files from disk — must run in Node.js runtime, not Edge
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    // Tree-shake large icon + animation libraries — reduces shared JS chunk
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
}

export default nextConfig
