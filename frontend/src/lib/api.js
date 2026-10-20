import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function apiError(error, fallback = "Something went wrong. Please try again.") {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (Array.isArray(data.errors) && data.errors.length) {
    return data.errors.map((e) => `${e.field}: ${e.message}`).join(" · ");
  }
  const detail = data.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  return fallback;
}
