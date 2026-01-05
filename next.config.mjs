/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 实验性路径 (Next.js 15 推荐配置)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;
