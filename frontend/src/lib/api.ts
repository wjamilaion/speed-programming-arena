const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://34.172.142.110:3001";

function getHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
        const identity = JSON.parse(localStorage.getItem("bugfix_identity") || "{}");
        return {
            "x-dev-id": identity.handle || "",
            "x-dev-name": identity.name || "",
            "x-dev-email": identity.email || "",
        };
    } catch (e) {
        return {};
    }
}

export async function fetchChallenge(id: string) {
    const res = await fetch(`${API_URL}/challenges/${id}`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch challenge");
    return res.json();
}

export async function adminLogin(password: string) {
    const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
    });
    if (!res.ok) {
        throw new Error("Invalid admin password");
    }
    return res.json();
}

export async function fetchEvents() {
    const res = await fetch(`${API_URL}/events`);
    return res.json();
}

export async function fetchEvent(id: string) {
    const res = await fetch(`${API_URL}/events/${id}`);
    return res.json();
}

export async function createEvent(data: any) {
    const res = await fetch(`${API_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function createChallenge(data: any) {
    const res = await fetch(`${API_URL}/challenges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function fetchEventLeaderboard(eventId: string) {
    const res = await fetch(`${API_URL}/leaderboard/event/${eventId}`);
    return res.json();
}

export async function submitSolution(formData: FormData, eventId?: string) {
    if (eventId) {
        formData.append("eventId", eventId);
    }
    const res = await fetch(`${API_URL}/submissions`, {
        method: "POST",
        body: formData,
        headers: getHeaders()
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit solution");
    }
    return res.json();
}

export async function fetchLeaderboard(challengeId: string) {
    const res = await fetch(`${API_URL}/leaderboard/${challengeId}`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return res.json();
}

export async function fetchSubmissions(challengeId?: string) {
    const query = challengeId ? `?challengeId=${challengeId}` : "";
    const res = await fetch(`${API_URL}/submissions${query}`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch submissions");
    return res.json();
}

export async function fetchPersonalStanding(eventId: string, userId: string) {
    const res = await fetch(`${API_URL}/leaderboard/event/${eventId}/user/${userId}`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch personal standing");
    return res.json();
}

export async function fetchPersonalChallengeStanding(challengeId: string, userId: string) {
    const res = await fetch(`${API_URL}/leaderboard/${challengeId}/user/${userId}`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch personal challenge standing");
    return res.json();
}

export async function fetchRecentSubmissions(eventId?: string, challengeId?: string) {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    if (challengeId) params.append('challengeId', challengeId);
    const res = await fetch(`${API_URL}/submissions/recent?${params.toString()}`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch recent submissions");
    return res.json();
}

export async function fetchEventSubmissions(eventId: string) {
    const res = await fetch(`${API_URL}/submissions/event/${eventId}`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch event submissions history");
    return res.json();
}

export async function downloadEventSubmissionsCsv(eventId: string) {
    window.open(`${API_URL}/submissions/event/${eventId}/export`, '_blank');
}
