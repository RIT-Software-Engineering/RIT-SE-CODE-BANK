import { InquiryType, RubricRow } from "@prisma/client";

export const exportForm = (f: any): any => {
    // There's gotta be a better way to do this...
    const inqs = f.inquiries;

    for (let i = 0; i < inqs.length; i++) {
        if (inqs[i].type == InquiryType.RATING) {
            inqs[i].labels = inqs[i].labels?.split(";");
        }

        if (inqs[i].type == InquiryType.RUBRIC) {
            inqs[i].rows = (inqs[i].rows as RubricRow[]).map((r) => ({
                ...r,
                options: r.options.split(";"),
            }));
        }
    }
    return f;
};
