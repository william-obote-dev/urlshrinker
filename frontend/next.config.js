/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify needs this for static export
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};
module.exports = nextConfig;
