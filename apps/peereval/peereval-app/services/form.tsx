import { FeedbackForm } from "@/types/assessment";
import { handleResponse } from "./utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";

export async function getAllForms(): Promise<FeedbackForm[]> {
    const res = await fetch(`${BASE_URL}/forms`, {
        credentials: "include",
    });

    return handleResponse(res, "Couldn't get feedback forms");
}
