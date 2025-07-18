import {
    Assessment,
    FeedbackForm,
    Inquiry,
    PeerFormResponse,
} from "@/types/assessment";
import { handleResponse } from "./utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";

export async function getAssessmentsByProject(
    projectId: string,
    query?: { responder?: string; receiver?: string }
): Promise<Assessment[]> {
    const queryParams = [];
    if (query?.responder) {
        queryParams.push("responder=" + query?.responder);
    }
    if (query?.receiver) {
        queryParams.push("receiver=" + query?.receiver);
    }

    const res = await fetch(
        `${BASE_URL}/assessments/byProject/${projectId}${
            queryParams.length > 0 ? "?" + queryParams.join("&") : ""
        }`,
        {
            credentials: "include",
        }
    );

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
        "Couldn't get responses for user " +
            responderId +
            " and assessment " +
            assessmentId
    );
}

export async function sendAssessmentResponses(
    assessmentId: string,
    responderId: string,
    respondeeId: string,
    responses: Record<string, string>
): Promise<PeerFormResponse[]> {
    console.log(`responderId: ${responderId}`);
    console.log(`respondeeId: ${respondeeId}`);

    const res = await fetch(
        `${BASE_URL}/assessments/${assessmentId}/addFeedback/${responderId}/${respondeeId}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ answers: responses }),
        }
    );

    return handleResponse(
        res,
        "Couldn't add feedback for responder " +
            responderId +
            ", respondee " +
            respondeeId +
            ", and assessment " +
            assessmentId
    );
}

export async function getReceivedAssessmentResponses(
    assessmentId: string,
    respondeeId: string
): Promise<PeerFormResponse[]> {
    const res = await fetch(
        `${BASE_URL}/assessments/${assessmentId}/responses/in/${respondeeId}`,
        {
            credentials: "include",
        }
    );

    return handleResponse(
        res,
        "Couldn't get responses for user " +
            respondeeId +
            " and assessment " +
            assessmentId
    );
}
