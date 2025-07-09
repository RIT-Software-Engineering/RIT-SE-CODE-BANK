import { UserProfile } from "@/types/userProfile";
import { handleResponse } from "./utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";

export async function getAllUserProfiles(): Promise<UserProfile[]> {
    const res = await fetch(`${BASE_URL}/users`, {
        credentials: "include",
    });

    return handleResponse(res, "Couldn't get user profiles");
}

export async function getUserProfile(id: string): Promise<UserProfile> {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
        credentials: "include",
    });

    return handleResponse(res, "Couldn't get user profile for ID " + id);
}

export async function getUserProfileByEmail(
    email: string
): Promise<UserProfile> {
    const res = await fetch(`${BASE_URL}/users/byEmail/${email}`, {
        credentials: "include",
    });

    return handleResponse(res, "Couldn't get user profile for email " + email);
}
