// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ----- 공통: 요청마다 access 헤더 주입 -----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ----- 401 대응: refresh 단일 실행 + 대기열 재시도 -----
let isRefreshing = false;
let pendingQueue = []; // { resolve, reject, config }

const processQueue = (error, newAccess = null) => {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      if (newAccess) {
        config.headers.Authorization = `Bearer ${newAccess}`;
      }
      resolve(api(config));
    }
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    // 401만 refresh 시도 (이미 한 번 시도했다면 루프 방지)
    if (status === 401 && !originalRequest?._retry) {
      const refreshToken = localStorage.getItem("refresh");
      if (!refreshToken) {
        // 리프레시가 없으면 갱신 불가 → 정리 후 거절
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        return Promise.reject(error);
      }

      // 이미 다른 요청이 refresh 중이면 큐에 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 주의: base axios 사용(순환 참조 방지)
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/signup/auth/refresh/`,
          { refresh: refreshToken }
        );

        const newAccess = data?.access;
        if (!newAccess) {
          throw new Error("No access token in refresh response");
        }

        // 새 access 저장 및 기본 헤더 적용
        localStorage.setItem("access", newAccess);
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

        // 대기열 재시도 처리
        processQueue(null, newAccess);
        isRefreshing = false;

        // 실패했던 원요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshErr) {
        // refresh 실패 → 토큰 정리 후 대기열 실패 처리
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        processQueue(refreshErr, null);
        isRefreshing = false;
        return Promise.reject(refreshErr);
      }
    }

    // 그 외 오류는 그대로 전달
    return Promise.reject(error);
  }
);

export default api;
