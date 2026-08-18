import api from "./axios";

export const loginUser = (data) => api.post("/auth/login", data);

export const registerUser = (data) => api.post("/auth/register", data);

// OAuth
export const googleLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
};

export const githubLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`;
};