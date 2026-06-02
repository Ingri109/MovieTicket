/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactCompiler: true,

  // Автоматично підставляємо безпечне значення для коду запитів
  env: {
    BACKEND_URL: '/api-proxy',
  },

  // Налаштовуємо маскування на сервері Vercel
  async rewrites() {
    return [
      {
        source: '/api-proxy/api/:path*',
        // Використовуємо логічне АБО, щоб у разі відсутності змінної збірка не падала
        destination: `${process.env.REAL_AZURE_URL || 'http://localhost:5016'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;