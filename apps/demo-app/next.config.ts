import type { NextConfig } from "next";
//find the right patht to the package
import path from "node:path";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [
    "@rit/teambuilding-components",
    "@rit/peereval-components",
  ],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    //add this so that the npm run dev command can find the correct packages
    root: path.resolve(__dirname, "../.."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
        
      },
    },
  },
};

export default nextConfig;
