const API_BASE_URL = "http://localhost:3000/api";

export async function fetchUserDetails(username) {
    const response = await fetch(
        `${API_BASE_URL}/user/${encodeURIComponent(username)}/details`
    );

    return response.json();
}

export async function fetchUserByUsername(username) {
    const response = await fetch(
        `${API_BASE_URL}/user?username=${encodeURIComponent(username)}`
    );

    return response.json();
}

export async function fetchUserTeams(userId) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/teams`);

    return response.json();
}

export async function updateUser(username, userInfo) {
    const response = await fetch(
        `${API_BASE_URL}/user/${encodeURIComponent(username)}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                firstName: userInfo.firstName.trim() || null,
                lastName: userInfo.lastName.trim() || null,
                email: userInfo.email.trim() || null,
            }),
        }
    );

    const data = await response.json();

    return {
        response,
        data,
    };
}