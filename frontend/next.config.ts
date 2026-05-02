import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy /uploads/* to the backend so images work from the browser
    // Uses the Docker internal service name "backend" for server-side routing
    const backendUrl = process.env.INTERNAL_BACKEND_URL || "http://backend:5000";
    return [
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
