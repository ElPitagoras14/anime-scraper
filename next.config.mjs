/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_IMAGE1_URL,
        port: "",
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_IMAGE2_URL,
        port: "",
      },
    ],
  },
};

export default nextConfig;