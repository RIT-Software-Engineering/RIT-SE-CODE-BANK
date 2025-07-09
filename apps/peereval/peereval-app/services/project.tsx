import { Project } from "@/types/project";
import { handleResponse } from "./utils";
import { UserProfile } from "@/types/userProfile";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";

export async function getProjectsByPeer(userId: string): Promise<Project[]> {
    const res = await fetch(`${BASE_URL}/projects/asPeer/${userId}`, {
        credentials: "include",
    });

    return handleResponse(
        res,
        "Couldn't get projects for user with ID " + userId
    );
}

export async function getProjectsByOverseer(
    userId: string
): Promise<Project[]> {
    const res = await fetch(`${BASE_URL}/projects/asOverseer/${userId}`, {
        credentials: "include",
    });

    return handleResponse(
        res,
        "Couldn't get projects for user with ID " + userId
    );
}

export async function getProjectOverseers(id: string): Promise<UserProfile[]> {
    const res = await fetch(`${BASE_URL}/projects/${id}/overseers`, {
        credentials: "include",
    });

    return handleResponse(res, "Couldn't find project with ID " + id);
}

export async function getProjectsPeers(id: string): Promise<UserProfile[]> {
    const res = await fetch(`${BASE_URL}/projects/getPeers/${id}`, {
        credentials: "include",
    });

    return handleResponse(res, "Couldn't get projects for user with ID " + id);
}

export async function addProjectPeerByEmail(
    id: string,
    email: string
): Promise<UserProfile> {
    const res = await fetch(`${BASE_URL}/projects/${id}/addPeer/${email}`, {
        method: "POST",
        credentials: "include",
    });

    return handleResponse(res, "Add peer error");
}

export async function removeProjectPeerByEmail(
    id: string,
    email: string
): Promise<UserProfile> {
    const res = await fetch(`${BASE_URL}/projects/${id}/removePeer/${email}`, {
        method: "DELETE",
        credentials: "include",
    });

    return handleResponse(res, "Remove peer error");
}
