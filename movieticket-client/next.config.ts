import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,

  // 1. Автоматично підставляємо безпечне значення для process.env.BACKEND_URL
  // У коді твоїх fetch-запитів воно перетвориться на "/api-proxy" і не спалить IP в браузері
  env: {
    BACKEND_URL: '/api-proxy',
  },

  // 2. Налаштовуємо маскування (проксі) на сервері Vercel
  async rewrites() {
    return [
      {
        // Коли фронтенд робитиме запит на /api-proxy/api/..., Vercel тихо перенаправить його на Azure
        source: '/api-proxy/api/:path*',
        destination: `${process.env.REAL_AZURE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;