import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ ADD THIS SECTION TO BREAK THE LOOP
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const publicPaths = ["/", "/login", "/register", "/pricing", "/about", "/contact", "/terms", "/privacy", "/support"];
      const currentPath = window.location.pathname;
      const isPublic = publicPaths.some(
        (p) => currentPath === p || currentPath.startsWith(`${p}/`)
      );

      if (!isPublic && currentPath !== "/login") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        // On public pages, just clear the token quietly don't redirect
        localStorage.removeItem("token");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
