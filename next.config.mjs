/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 标准路径 (Next.js 15+)
  serverActions: {
    bodySizeLimit: '100mb',
  },
  // 实验性路径 (旧版本或某些特定版本)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;
