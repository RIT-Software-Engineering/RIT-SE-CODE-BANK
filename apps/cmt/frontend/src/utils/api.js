import { CMTFetch } from "@se-code-bank/cmt-shared-utilities"

export const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:5010/api/cmt";
export const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5010";

/**
 * Uses {@link CMTFetch}
 * 
 * @param {string} method 
 * @param {string} url 
 * @param {Object} [body]
 * @param {Object} [headers] 
 */
export async function CMTJsonFetch(method, url, body, headers) {
    return CMTFetch(
        method,
        url,
        body ? JSON.stringify(body) : undefined,
        { ...headers, "Content-Type": "application/json" },
        API_BASE,
        response => response.json()
    )
}

/**
 * Uses {@link CMTFetch}
 * 
 * @param {string} method 
 * @param {string} url 
 * @param {Object} [body]
 * @param {Object} [headers] 
 */
export async function CMTFormFetch(method, url, body, headers) {
    return CMTFetch(
        method,
        url,
        body,
        headers,
        API_BASE,
        response => response.json()
    )
}

/**
 * Instead of giving you the response.json, gives the plain response.
 * 
 * Most usages can use the other functions, but when you want to call other things on the response,
 * like .blob(), this is likely neccesary
 * Uses {@link CMTFetch}
 * 
 * @param {string} method 
 * @param {string} url 
 * @param {Object} [body]
 * @param {Object} [headers] 
 */
export async function CMTJsonFetchRaw(method, url, body, headers) {
    return CMTFetch(
        method,
        url,
        body,
        headers,
        API_BASE,
        response => new Promise(resolve => resolve(response))
    )
}
