import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const AUTH_STORAGE_KEY = "sehatora-crm-auth";

interface StoredAuth {
  state?: { accessToken?: string; refreshToken?: string };
}

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeTokens(access: string, refresh: string) {
  const parsed = readStoredAuth() ?? { state: {} };
  parsed.state = { ...parsed.state, accessToken: access, refreshToken: refresh };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
}

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const stored = readStoredAuth();
  const token = stored?.state?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshingPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const stored = readStoredAuth();
  const refreshToken = stored?.state?.refreshToken;
  if (!refreshToken) throw new Error("No refresh token available");

  const response = await axios.post("/api/auth/refresh/", { refresh: refreshToken });
  const newAccess = response.data.access as string;
  writeTokens(newAccess, refreshToken);
  return newAccess;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes("/auth/")) {
      originalRequest._retry = true;
      try {
        refreshingPromise = refreshingPromise ?? refreshAccessToken();
        const newAccess = await refreshingPromise;
        refreshingPromise = null;
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        refreshingPromise = null;
        localStorage.removeItem(AUTH_STORAGE_KEY);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export { AUTH_STORAGE_KEY };
