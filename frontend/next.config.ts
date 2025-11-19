import type { NextConfig } from "next";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://cdn.jkdesu.com/assets/images/**"),
      new URL("https://i.ibb.co/**"),
    ],
  },
};

export default nextConfig;
