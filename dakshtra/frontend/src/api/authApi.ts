import api from "./axiosConfig";

export const loginApi = (payload: { email: string; password: string }, csrfToken: string) =>
  api.post("/api/auth/login", payload, { headers: { "X-CSRF-Token": csrfToken } });

export const registerApi = (payload: { full_name: string; email: string; password: string; role: string }, csrfToken: string) =>
  api.post("/api/auth/register", payload, { headers: { "X-CSRF-Token": csrfToken } });

export const logoutApi = () => api.post("/api/auth/logout");
