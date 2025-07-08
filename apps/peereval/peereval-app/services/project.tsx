import { Project } from "@/types/project";
import { handleResponse } from "./utils";

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
