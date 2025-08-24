import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 백엔드 기본 주소
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
