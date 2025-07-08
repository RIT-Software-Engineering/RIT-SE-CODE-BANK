import { handleResponse } from "./utils";

// services/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";

export async function getUserProfile<User>(id: string): Promise<User> {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
        credentials: "include",
    });

    return handleResponse(res, "Couldn't get user profile for ID " + id);
}

export async function getUserProfileByEmail<User>(
    email: string
): Promise<User> {
    const res = await fetch(`${BASE_URL}/users/byEmail/${email}`, {
        credentials: "include",
    });

    return handleResponse(res, "Couldn't get user profile for email " + email);
}

export async function post<T>(path: string, body: any): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new Error(`POST ${path} failed: ${res.statusText}`);
    }
    return res.json();
}
