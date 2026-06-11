import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withBA = withBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.sanity.io",
            },
            {
                protocol: "https",
                hostname: "media.futbolmania.com",
            },
        ],
    },
};

export default withSentryConfig(withBA(nextConfig), {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: process.env.NODE_ENV === "development",
    widenClientFileUpload: true,
    disableLogger: true,
    automaticVercelMonitors: false,
});
