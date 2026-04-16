import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Use separate build directories for dev vs production to prevent
  // 'next build' from corrupting the dev server's cache
  distDir: process.env.NODE_ENV === "production" ? ".next-prod" : ".next",
};

export default nextConfig;
