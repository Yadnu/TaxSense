import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Server-side external packages ─────────────────────────────────────────
  // These packages contain native binaries, WASM files, or rely on Node.js
  // internals that webpack cannot bundle correctly. By listing them here,
  // Next.js uses Node's require() for them at runtime instead of bundling.
  serverExternalPackages: [
    // OCR / document extraction
    "@anthropic-ai/sdk",
    // PDF text extraction
    "pdf-parse",
    // AWS SDK v3 clients (they import optional sub-packages dynamically)
    "@aws-sdk/client-s3",
    "@aws-sdk/client-textract",
    "@aws-sdk/s3-request-presigner",
    "@aws-sdk/lib-storage",
    // HuggingFace Inference SDK
    "@huggingface/inference",
    // epub parsing
    "epub2",
    // Prisma (already handled by next-prisma but explicit is safer)
    "@prisma/client",
    "prisma",
  ],

  // ── Image domains ─────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      // Clerk profile images
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
    ],
  },
};

export default nextConfig;
