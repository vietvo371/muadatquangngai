import axios from "axios";

// Sau rewire: mọi lời gọi dùng path /api/v2/* trên CÙNG origin (Next.js phục vụ cả trang
// lẫn API). baseURL rỗng = same-origin (chạy đúng trên Vercel và dev :3000).
// NEXT_PUBLIC_API_URL nếu set sẽ ghi đè — dùng khi muốn trỏ sang backend ngoài (vd Laravel).
const getBaseURL = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || "";
  if (url.endsWith("/")) {
    url = url.substring(0, url.length - 1);
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login") &&
      !error.config?.url?.includes("/auth/otp/login")
    ) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
