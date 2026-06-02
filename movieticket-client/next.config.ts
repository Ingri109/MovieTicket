/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  reactCompiler: true,

  // Додаємо ОБИДВІ змінні сюди. 
  // Тепер Next.js автоматично підмінить їх у коді на безпечний відносний шлях.
  env: {
    BACKEND_URL: '/api-proxy',
    NEXT_PUBLIC_BACKEND_URL: '/api-proxy',
  },

  // Налаштовуємо маскування (проксі) на серверах Vercel
  async rewrites() {
    return [
      {
        // Оскільки у твоєму коді додається "/api", цей запит перетвориться на /api-proxy/api/...
        // Vercel перехопить його і тихо перенаправить на твій реальний Azure
        source: '/api-proxy/api/:path*',
        destination: `${process.env.REAL_AZURE_URL || 'http://localhost:5016'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;