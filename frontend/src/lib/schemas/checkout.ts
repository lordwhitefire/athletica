import { z } from "zod";

export const checkoutSchema = z.object({
    fullName: z.string().min(1, "Full name is required."),
    email: z.string().email("Enter a valid email address."),
    address: z.string().min(1, "Address is required."),
    city: z.string().min(1, "City is required."),
    postalCode: z.string().min(1, "Postal code is required."),
    country: z.string().min(1, "Country is required."),
    phone: z.string().default(""),
});

export type CheckoutInput = z.output<typeof checkoutSchema>;
