/** @type {import('next').NextConfig} */
const nextConfig = {
  // Point Next.js to the frontend directory
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
  // Update the source directory
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  webpack: config => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  transpilePackages: ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
};

module.exports = nextConfig;
