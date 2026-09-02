import api from "./axios";
export const getHistory = () => api.get("/report");
export const getReport = (id) => axios.get(`/report/${id}`);
