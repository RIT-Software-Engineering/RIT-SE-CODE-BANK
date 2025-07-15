import { Project } from "@/types/project";
import { handleResponse } from "./utils";
import { UserProfile } from "@/types/userProfile";
import { Assessment } from "@/types/assessment";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";

export async function createProject(
    project: {
        name: string;
        description: string;
        peerEmails: string[];
    },
    uid: string
): Promise<Project> {
    const res = await fetch(`${BASE_URL}/projects/`, {
        method: "POST",
        headers: { "x-user-id": uid, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(project),
    });

    return handleResponse(res, "Couldn't create project");
}

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

export async function assignAssessmentToProject(
    projectId: string,
    assessment: {
        formId: string;
        name: string;
        description: string;
        startDate: string;
        dueDate: string;
    }
): Promise<Assessment> {
    const res = await fetch(
        `${BASE_URL}/projects/${projectId}/assignAssessment`,
        {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...assessment,
                startDate: new Date(assessment.startDate),
                dueDate: new Date(assessment.dueDate),
            }),
        }
    );

    return handleResponse(res, "Failed to assign assessment");
}
