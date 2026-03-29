import api from "./axiosConfig";

export const workforceSummaryReportApi = () => api.get("/api/reports/workforce-summary", { responseType: "blob" });
export const skillGapReportApi = () => api.get("/api/reports/skill-gap");
export const forecastReportApi = () => api.get("/api/reports/forecast", { responseType: "blob" });
