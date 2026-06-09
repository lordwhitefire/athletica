import { z } from "zod";

interface CategoryNavItem {
    _key?: string;
    label: string;
    href?: string;
    children?: CategoryNavItem[];
}

export const navigationItemSchema: z.ZodType<CategoryNavItem> = z.object({
    _key: z.string().optional(),
    label: z.string().min(1, "Label is required."),
    href: z.string().optional().default(""),
    children: z.array(z.lazy(() => navigationItemSchema)).optional().default([]),
});

export const navigationSchema = z.array(navigationItemSchema);

export type NavigationItemInput = z.infer<typeof navigationItemSchema>;
