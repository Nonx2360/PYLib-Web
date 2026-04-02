import axios from "axios";

import { useStudentAuthStore } from "../store/studentAuth";

const studentApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
});

studentApi.interceptors.request.use((config) => {
  const token = useStudentAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

studentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useStudentAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default studentApi;
