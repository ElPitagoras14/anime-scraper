import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "animeflv.net",
        port: "",
      },
      {
        protocol: "https",
        hostname: "www3.animeflv.net",
        port: "",
      },
      {
        protocol: "https",
        hostname: "cdn.buymeacoffee.com",
        port: "",
      },
    ],
  },
};

export default nextConfig;
