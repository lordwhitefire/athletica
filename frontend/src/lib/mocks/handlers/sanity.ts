import { http, HttpResponse } from "msw";

const SANITY_PROJECT_ID = "cuiis46d";
const SANITY_DATASET = "production";
const SANITY_API_URL = `https://${SANITY_PROJECT_ID}.api.sanity.io/v*/${SANITY_DATASET}`;

export const sanityHandlers = [
    http.get(`${SANITY_API_URL}/data/query*`, () => {
        return HttpResponse.json({ result: [], ms: 1, query: "" });
    }),

    http.post(`${SANITY_API_URL}/data/mutate*`, () => {
        return HttpResponse.json({ results: [{ id: "new-product-id", operation: "create" }] });
    }),
];

export function sanityMutateReturnsError() {
    return http.post(`${SANITY_API_URL}/data/mutate*`, () => {
        return HttpResponse.json({ error: "Internal Server Error" }, { status: 500 });
    });
}

export function sanityQueryReturnsProducts(products: unknown[]) {
    return http.get(`${SANITY_API_URL}/data/query*`, () => {
        return HttpResponse.json({ result: products, ms: 1, query: "" });
    });
}
