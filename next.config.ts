import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    // Tree-shake large icon + animation libraries — reduces shared JS chunk
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
}

export default nextConfig
