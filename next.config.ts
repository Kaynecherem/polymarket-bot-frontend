import type { NextConfig } from "next";

const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  // standalone output is for Docker only — Vercel handles its own bundling
  ...(isVercel ? {} : { output: "standalone" }),
  // Vercel expects .next; Docker uses .next-prod to avoid dev/prod cache conflicts
  distDir: isVercel ? ".next" : process.env.NODE_ENV === "production" ? ".next-prod" : ".next",
};

export default nextConfig;
