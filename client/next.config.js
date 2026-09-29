/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Always proxy browser /api/* to the Express backend.
    // Prefer API_INTERNAL_URL; never use NEXT_PUBLIC_API_URL here
    // (that value is often "/api" and would break the rewrite).
    const raw =
      process.env.API_INTERNAL_URL ||
      process.env.BACKEND_URL ||
      'http://127.0.0.1:5050/api';

    let base = String(raw).trim().replace(/\/$/, '');
    // If someone set host-only URL, append /api
    if (!base.endsWith('/api')) {
      base = `${base}/api`;
    }

    const destination = `${base}/:path*`;
    console.log(`[next.config] API rewrite: /api/:path* -> ${destination}`);

    return [
      {
        source: '/api/:path*',
        destination,
      },
    ];
  },
};

module.exports = nextConfig;
