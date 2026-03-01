/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/logs',
        destination: 'http://localhost:8000/logs',
      },
      {
        source: '/api/logs/stream',
        destination: 'http://localhost:8000/logs/stream',
      },
      {
        source: '/api/shipments',
        destination: 'http://localhost:8000/shipments',
      },
      {
        source: '/api/events',
        destination: 'http://localhost:8000/events',
      },
      {
        source: '/api/payments',
        destination: 'http://localhost:8000/payments',
      },
      {
        source: '/api/settings',
        destination: 'http://localhost:8000/settings',
      },
    ];
  },
};

export default nextConfig;
