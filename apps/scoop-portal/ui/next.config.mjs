import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: '/scoop-portal',
    assetPrefix: '/scoop-portal',
    outputFileTracingRoot: path.join(__dirname),
    async rewrites() {
    return [
      {
        // Matches any path starting with /api/notifications
        source: '/api/notifications/:path*',
        // Proxies it to backend server
        destination: 'http://localhost:4000/api/notifications/:path*',
      }
    ];
  },
};

export default nextConfig;
