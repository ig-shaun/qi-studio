/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ixo-studio/core"],
  webpack(config) {
    // Workspace package (@ixo-studio/core) uses TS Bundler resolution — imports
    // reference sibling `.js` files that resolve to `.ts` source. Teach Webpack
    // the same rule so Next.js can load them without pre-compiling.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
