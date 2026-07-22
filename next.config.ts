import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      'firebase',
      'framer-motion',
      'lucide-react',
      'jspdf',
      'html2canvas',
      '@base-ui-components/react',
    ],
  },
  turbopack: {
    root: '/Users/nicho/Research/freelance-os',
  },
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
