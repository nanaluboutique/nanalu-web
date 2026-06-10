import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build a minimal, self-contained server (server.js + trimmed node_modules)
  // so we can package a small, portable Docker image. Keeps hosting
  // deployment-agnostic. See Dockerfile.
  output: "standalone",
};

export default nextConfig;
