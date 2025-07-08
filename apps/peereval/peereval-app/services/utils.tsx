export async function handleResponse(
    res: Response,
    errString: string | null = null
): Promise<any> {
    if (!res.ok) {
        throw new Error(
            `${errString ?? "Error handling response"}: ${res.statusText}`
        );
    }

    let data;
    try {
        data = res.json();
    } catch (err) {
        throw new Error("Failed to parse response JSON");
    }

    return data;
}
