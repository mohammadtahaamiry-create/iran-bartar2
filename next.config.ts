import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict TypeScript: build fails on type errors so bugs can't ship.
  // (Previously `ignoreBuildErrors: true` was hiding real type issues.)
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: "./tsconfig.json",
  },
  reactStrictMode: false,
};

export default nextConfig;
