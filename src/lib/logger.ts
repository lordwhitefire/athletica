import * as Sentry from "@sentry/nextjs";

interface Logger {
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(error: unknown, message?: string, context?: Record<string, unknown>): void;
    setUser(user: { id: string; email: string } | null): void;
    clearUser(): void;
}

const isSentryEnabled = !!process.env.SENTRY_DSN;

export const logger: Logger = {
    info(message, context) {
        if (isSentryEnabled) {
            Sentry.addBreadcrumb({ message, data: context, level: "info" });
        }
    },

    warn(message, context) {
        if (isSentryEnabled) {
            Sentry.captureMessage(message, { level: "warning", extra: context });
        }
    },

    error(error, message, context) {
        if (isSentryEnabled) {
            Sentry.captureException(error, {
                extra: { ...context, message },
            });
        } else {
            console.error(message ?? "Error:", error);
        }
    },

    setUser(user) {
        if (isSentryEnabled) {
            Sentry.setUser(user ?? null);
        }
    },

    clearUser() {
        if (isSentryEnabled) {
            Sentry.setUser(null);
        }
    },
};
