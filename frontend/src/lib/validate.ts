import { z } from "zod";
import { failValidation, type FieldError } from "./api-types";

export function validateOrFail<T>(
    schema: z.ZodSchema<T>,
    input: unknown
): { data: T } | { error: ReturnType<typeof failValidation> } {
    const result = schema.safeParse(input);
    if (!result.success) {
        const fields: FieldError[] = result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));
        return { error: failValidation(fields) };
    }
    return { data: result.data };
}
