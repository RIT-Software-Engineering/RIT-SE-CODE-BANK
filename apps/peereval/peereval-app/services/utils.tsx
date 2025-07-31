export async function handleResponse(
    res: Response,
    errString: string | null = null,
    parseJSON: boolean = true
): Promise<any> {
    if (!res.ok) {
        throw new Error(
            `${errString ?? "Error handling response"}: ${res.statusText}`
        );
    }

    if (parseJSON) {
        let data;
        try {
            data = res.json();
        } catch (err) {
            throw new Error("Failed to parse response JSON");
        }

        return data;
    } else return;
}
