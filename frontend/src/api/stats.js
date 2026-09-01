// frontend/src/api/stats.js
import axios from "./axios";

export const getPublicStats = () => axios.get("/api/stats/public");