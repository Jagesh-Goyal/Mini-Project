import api from "./axiosConfig";

export const skillMatrixApi = () => api.get("/api/skills/matrix");
export const heatmapApi = () => api.get("/api/skills/heatmap");
export const skillsApi = () => api.get("/api/skills");
