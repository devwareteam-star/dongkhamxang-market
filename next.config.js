/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['images.pexels.com'],
  },
  output: 'export'  // ✅ Use a string here!
}

module.exports = nextConfig
