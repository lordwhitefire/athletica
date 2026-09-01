import { z } from "zod";

export const amazonLinkSchema = z.object({
    productId: z.string().min(1, "Product ID is required."),
    url: z.string().url("Enter a valid URL."),
});

export const amazonLinksSchema = z.array(amazonLinkSchema);

export type AmazonLinkInput = z.infer<typeof amazonLinkSchema>;
