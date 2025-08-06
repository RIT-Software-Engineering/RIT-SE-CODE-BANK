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
    scale: number; // e.g., 5 for 1-5, 10 for 1-10
    labels: string; // Optional: leftLabel;rightLabel
};

export type RubricInquiry = BaseInquiry & {
    type: InquiryType.RUBRIC;
    options: string; // e.g., Poor;Average;Excellent
    rows: RubricRow[];
};

export type RubricRow = {
    label: string;
};

export type Inquiry = FreeResponseInquiry | RatingInquiry | RubricInquiry;

// For a single peer
export type PeerFormResponse = {
    id: string;
    assessmentId: string;
    responderId: string;
    respondeeId: string;
    responses: PeerInquiryResponse[];
};

export type PeerInquiryResponse = {
    id: string;
    answer: string;
    formResponseId: string;
    inquiryId: string;
};
