import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      { source: "/", destination: "/ar", permanent: false },
      // password-based auth was replaced by the name + email entry form
      ...["signup", "login", "verify", "forgot", "forgot/sent"].map((page) => ({
        source: `/:locale(ar|en)/${page}`,
        destination: "/:locale/start",
        permanent: false,
      })),
    ];
  },
};

export default nextConfig;
