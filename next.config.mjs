/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 实验性路径 (Next.js 15 推荐配置)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
      // 允许这些域名调用 Server Actions（解决 iframe 跨域登录问题）
      allowedOrigins: [
        'zjerp.lengdo.com',
        'kaifa.wanpuxx.com',
        'www.wanpuxx.com',
        'localhost:3000',
      ],
    },
  },
  
  // 配置允许 iframe 嵌入和跨域请求
  async headers() {
    return [
      {
        // 针对所有路由
        source: '/:path*',
        headers: [
          // 允许指定域名通过 iframe 嵌入（支持所有 wanpuxx.com 和 lengdo.com 子域名）
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' http://*.lengdo.com https://*.lengdo.com http://*.wanpuxx.com https://*.wanpuxx.com",
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
