import { z } from "zod";

const serverEnvSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),

    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

    UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),

    SENTRY_DSN: z.string().url("SENTRY_DSN must be a valid URL"),
    SENTRY_AUTH_TOKEN: z.string().min(1, "SENTRY_AUTH_TOKEN is required"),
    SENTRY_ORG: z.string().min(1, "SENTRY_ORG is required"),
    SENTRY_PROJECT: z.string().min(1, "SENTRY_PROJECT is required"),

    SANITY_WRITE_TOKEN: z.string().min(1, "SANITY_WRITE_TOKEN is required"),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

export function getEnv(): ServerEnv {
    if (cachedEnv) return cachedEnv;
    const result = serverEnvSchema.safeParse(process.env);
    if (!result.success) {
        const missing = result.error.issues
            .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
            .join("\n");
        throw new Error(
            `Missing or invalid environment variables:\n${missing}\n\n` +
            `Copy .env.example to .env.local and fill in the values.`
        );
    }
    cachedEnv = result.data;
    return result.data;
}
