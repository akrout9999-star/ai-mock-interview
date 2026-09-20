const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export function getToken() {
  return localStorage.getItem("interview_ai_token");
}

export function setToken(token) {
  localStorage.setItem("interview_ai_token", token);
}

export function removeToken() {
  localStorage.removeItem("interview_ai_token");
}

async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Unable to connect to the INTERVIEW/AI server. Please try again."
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
    }

    const message =
      data?.detail ||
      data?.message ||
      "Something went wrong while processing your request.";

    throw new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
  }

  return data;
}

export const api = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getInterviews: () => request("/interviews"),

  createInterview: (payload) =>
    request("/interviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  submitAnswer: (interviewId, answer) =>
    request(`/interviews/${interviewId}/answer`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    }),

  getReport: (interviewId) =>
    request(`/interviews/${interviewId}/report`),
};