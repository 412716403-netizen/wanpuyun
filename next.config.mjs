/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 实验性路径 (Next.js 15 推荐配置)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  
  // 配置允许 iframe 嵌入和跨域请求
  async headers() {
    return [
      {
        // 针对所有路由
        source: '/:path*',
        headers: [
          // 允许指定域名通过 iframe 嵌入
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' http://zjerp.lengdo.com http://www.wanpuxx.com https://www.wanpuxx.com",
          },
          // CORS 跨域请求头（同时支持 HTTP 和 HTTPS）
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'http://www.wanpuxx.com' 
              : 'http://zjerp.lengdo.com',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type,Authorization,Cookie,X-Requested-With',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
