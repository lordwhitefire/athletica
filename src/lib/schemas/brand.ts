import { z } from "zod";

export const brandFormSchema = z.object({
    name: z.string().min(1, "Brand name is required.").max(100, "Brand name is too long."),
    logo_asset: z.string().optional().default(""),
});

export type BrandFormData = z.infer<typeof brandFormSchema>;
