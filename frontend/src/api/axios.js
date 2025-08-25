import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ----- 요청 인터셉터: access 토큰 헤더 주입 -----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ----- refresh 토큰 로직 -----
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

    // ----- 401만 refresh 시도 -----
    if (status === 401 && !originalRequest?._retry) {
      const refreshToken = localStorage.getItem("refresh");
      if (!refreshToken) {
        // refresh 없음 → 로그인 필요
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        // 로그인 모달 열기 이벤트 발행
        window.dispatchEvent(new Event("authError"));
        return Promise.reject(error);
      }

      // 이미 refresh 중이면 큐에 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // base axios 사용 (순환 참조 방지)
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/signup/auth/refresh/`,
          { refresh: refreshToken }
        );

        const newAccess = data?.access;
        if (!newAccess) {
          throw new Error("No access token in refresh response");
        }

        // 새 access 저장
        localStorage.setItem("access", newAccess);
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

        // 대기열 처리
        processQueue(null, newAccess);
        isRefreshing = false;

        // 실패했던 원요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshErr) {
        // refresh 실패 → 토큰 정리 + 모달 이벤트
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        processQueue(refreshErr, null);
        isRefreshing = false;

        // 로그인 모달 열기 이벤트 발행
        window.dispatchEvent(new Event("authError"));

        return Promise.reject(refreshErr);
      }
    }

    // 403일 경우에도 로그인 모달 열기 (선택사항)
    if (status === 403) {
      window.dispatchEvent(new Event("authError"));
    }

    return Promise.reject(error);
  }
);

export default api;