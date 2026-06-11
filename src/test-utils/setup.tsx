import "@testing-library/jest-dom";
import React from "react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { toHaveNoViolations } from "jest-axe";
import { server } from "@/lib/mocks/server";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        prefetch: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
}));

vi.mock("next/link", () => ({
    default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
        <a href={href} {...props}>{children}</a>,
}));

vi.mock("next/image", () => ({
    default: ({ src, alt }: { src: string; alt: string }) => {
        return <img src={src} alt={alt} />;
    },
}));

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
        })),
    }),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock("@/lib/admin-sanity", () => ({
    adminClient: {
        fetch: vi.fn(),
        createOrReplace: vi.fn(),
        patch: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ commit: vi.fn() }) }),
        delete: vi.fn(),
    },
}));

vi.mock("framer-motion", async () => {
    const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
    return {
        ...actual,
        motion: {
            div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
            span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>,
            ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => <ul {...props}>{children}</ul>,
            li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => <li {...props}>{children}</li>,
            nav: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => <nav {...props}>{children}</nav>,
        },
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});

// ─── MSW server lifecycle ─────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
