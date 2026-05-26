import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "media.futbolmania.com",
                pathname: "/media/catalog/product/**",
            },
        ],
    },
};

export default nextConfig;
