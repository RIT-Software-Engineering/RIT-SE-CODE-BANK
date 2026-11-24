/**
 * Shared Assessment Types
 * 
 * Defines the TypeScript data structure used by PeerEval's reusable
 * assessment components.
 * 
 * Includes assessment definitions, feedback forms, inquiry types,
 * rubric configuration, and peer assessment response structures.
 * 
 * These types allow applications to consume the components using
 * consistent data structures without importing PeerEval's backend.
 */
export type Assessment = {
    id: string;
    projectId: string;
    name: string;
    description: string;
    startDate: string;
    dueDate: string;
    feedbackForm: FeedbackForm;
};

export type FeedbackForm = {
    id: string;
    name: string;
    inquiries: Inquiry[];
};

export type BaseInquiry = {
    id: string;
    question: string;
};

// Identifies the supported types of feedback questions.
export enum InquiryType {
    FREE_RESPONSE = "FREE_RESPONSE",
    RATING = "RATING",
    RUBRIC = "RUBRIC",
}

export type FreeResponseInquiry = BaseInquiry & {
    type: InquiryType.FREE_RESPONSE;
};

export type RatingInquiry = BaseInquiry & {
    type: InquiryType.RATING;
    scale: number;
    labels: string;
};

export type RubricInquiry = BaseInquiry & {
    type: InquiryType.RUBRIC;
    options: string;
    rows: RubricRow[];
};

export type RubricRow = {
    label: string;
};

export type Inquiry = FreeResponseInquiry | RatingInquiry | RubricInquiry;

export type PeerFormResponse = {
    id: string;
    assessmentId: string;
    responderId: string;
    respondeeId: string;
    responses: PeerInquiryResponse[];
    submittedAt: string | null;
    releasedAt: string | null;
};

export type PeerInquiryResponse = {
    id: string;
    answer: string;
    formResponseId: string;
    inquiryId: string;
};