export type ApiErrorType =
    | "api_error"
    | "auth_error"
    | "validation_error"
    | "not_found"
    | "network_error";

export interface FieldError {
    field: string;
    message: string;
}

export interface ApiError {
    type: ApiErrorType;
    code: string;
    message: string;
    fields?: FieldError[];
}

export interface ApiSuccess<T> {
    data: T;
    error: null;
}

export interface ApiFailure {
    data: null;
    error: ApiError;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export function failValidation(errors: FieldError[]): ApiFailure {
    return {
        data: null,
        error: {
            type: "validation_error",
            code: "validation_failed",
            message: "Some fields are invalid.",
            fields: errors,
        },
    };
}

export function ok<T>(data: T): ApiSuccess<T> {
    return { data, error: null };
}

export function fail(
    type: ApiErrorType,
    code: string,
    message: string
): ApiFailure {
    return { data: null, error: { type, code, message } };
}

export function fromCaughtError(err: unknown, code: string): ApiFailure {
    const message =
        err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.";
    return fail("api_error", code, message);
}
