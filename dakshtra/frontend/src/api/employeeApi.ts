import api from "./axiosConfig";

export const listEmployeesApi = (search = "") => api.get("/api/employees", { params: { search } });
export const createEmployeeApi = (payload: unknown, csrfToken: string) =>
  api.post("/api/employees", payload, { headers: { "X-CSRF-Token": csrfToken } });
