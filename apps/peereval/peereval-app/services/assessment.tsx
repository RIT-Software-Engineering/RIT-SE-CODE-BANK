import { Assessment, Inquiry, PeerFormResponse } from "@/types/assessment";
import { handleResponse } from "./utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";

export async function getAssessmentsByProject(
    projectId: string
): Promise<Assessment[]> {
    const res = await fetch(`${BASE_URL}/assessments/byProject/${projectId}`, {
        credentials: "include",
    });

    return handleResponse(
        res,
        "Couldn't get assessments for project with ID " + projectId
    );
}

export async function getAssessmentById(id: string): Promise<Assessment> {
    const res = await fetch(`${BASE_URL}/assessments/${id}`, {
        credentials: "include",
    });

    return handleResponse(res, "Couldn't get assessment with ID " + id);
}

export async function getAssessmentInquiriesById(
    id: string
): Promise<Inquiry[]> {
    const res = await fetch(`${BASE_URL}/assessments/${id}/inquiries`, {
        credentials: "include",
    });

    return handleResponse(
        res,
        "Couldn't get inquiries from assessment with ID " + id
    );
}

export async function getAssessmentPeerResponses(
    assessmentId: string,
    responderId: string
): Promise<PeerFormResponse[]> {
    const res = await fetch(
        `${BASE_URL}/assessments/responses/${responderId}/${assessmentId}`,
        {
            credentials: "include",
        }
    );

    return handleResponse(
        res,
        "Couldn't get responses for user " + responderId + " and assessment "
    );
}
