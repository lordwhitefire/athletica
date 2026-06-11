import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test-utils/setup.tsx"],
        include: ["src/**/*.test.{ts,tsx}"],
        exclude: ["node_modules", ".next", "e2e"],
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov", "html"],
            include: ["src/lib/**/*.ts", "src/components/**/*.tsx"],
            exclude: ["src/lib/schemas/**", "src/test-utils/**"],
            thresholds: {
                lines: 80,
                branches: 70,
                functions: 80,
                statements: 80,
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
