import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build a minimal, self-contained server (server.js + trimmed node_modules)
  // so we can package a small, portable Docker image. Keeps hosting
  // deployment-agnostic. See Dockerfile.
  output: "standalone",

  // Allow next/image to optimize Cloudinary-hosted images (#42). A remote
  // <Image> src isn't hotlinked — Next's server fetches it, resizes it, and
  // re-serves it from /_next/image. remotePatterns is the allowlist for that
  // server-side fetch (an anti-SSRF guard): without res.cloudinary.com here,
  // Next refuses the host — the optimizer returns HTTP 400 and images break.
  // Scoped to that one
  // host over HTTPS on purpose — keeping it a guard, not a hole. The cloud
  // name lives in the path (…/<cloud>/image/upload/…), so it isn't pinned
  // here and "demo" today → the real account later needs no config change.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
