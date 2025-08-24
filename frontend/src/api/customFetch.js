const API_BASE = import.meta.env.VITE_API_URL;

export async function customFetch(url, options = {}, retry = true) {
  const accessToken = localStorage.getItem("accessToken");

  // 기본 헤더 설정
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  let response = await fetch(API_BASE + url, {
    ...options,
    headers,
  });

  // accessToken 만료 → refresh 시도
  if (response.status === 401 && retry) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      const refreshRes = await fetch(API_BASE + "/api/signup/auth/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshRes.ok) {
        const { access } = await refreshRes.json();
        localStorage.setItem("accessToken", access);

        // 원래 요청 재시도 (retry = false로 무한 루프 방지)
        return customFetch(url, options, false);
      } else {
        // refresh도 만료 → 로그아웃 처리
        localStorage.clear();
        window.location.href = "/login";
        throw new Error("세션이 만료되었습니다. 다시 로그인하세요.");
      }
    }
  }

  // 응답 JSON 변환
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || `HTTP 오류: ${response.status}`);
  }

  return data; // axios처럼 data만 반환
}