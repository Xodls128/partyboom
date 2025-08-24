export async function customFetch(url, options = {}) {
  const accessToken = localStorage.getItem("accessToken");

  // 기본 헤더 설정
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  try {
    let response = await fetch(import.meta.env.VITE_API_URL + url, {
      ...options,
      headers,
    });

    // accessToken 만료 → refresh 시도
    if (response.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");
      const refreshRes = await fetch(
        import.meta.env.VITE_API_URL + "/users/auth/refresh/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        }
      );

      if (refreshRes.ok) {
        const { access } = await refreshRes.json();
        localStorage.setItem("accessToken", access);

        // 원래 요청 재시도
        response = await fetch(import.meta.env.VITE_API_URL + url, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${access}` },
        });
      } else {
        // refresh도 실패 → 로그아웃 처리
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return response;
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
}
