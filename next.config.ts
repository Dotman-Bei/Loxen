import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A separate build folder lets a second server (e.g. an end-to-end run against a local chain)
  // run beside `npm run dev` without the two overwriting each other's output.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
