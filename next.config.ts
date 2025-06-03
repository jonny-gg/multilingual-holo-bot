import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone build for Docker production deployments
  output: 'standalone',
  
  // Enable compression for better performance
  compress: true,
  
  // Optimize images
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      },
      {
        source: '/api/metrics',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8'
          }
        ]
      }
    ];
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@react-three/fiber', '@react-three/drei']
  },

  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    resolveAlias: {
      // Fix Google Fonts resolution with Turbopack
      '@next/font/google': '@next/font/dist/google',
    }
  },
  
  // Webpack configuration for better build optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            three: {
              test: /[\\/]node_modules[\\/](@react-three|three)[\\/]/,
              name: 'three',
              chunks: 'all',
            }
          }
        }
      };
    }
    
    return config;
  }
};

export default nextConfig;
