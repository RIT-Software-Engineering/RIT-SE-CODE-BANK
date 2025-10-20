import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: '/scoop-portal',
    assetPrefix: '/scoop-portal',
};

export default nextConfig;
