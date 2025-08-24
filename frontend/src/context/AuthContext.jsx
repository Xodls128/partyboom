// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';

// 1) 컨텍스트 생성
const AuthContext = createContext(null);

// 2) 사용 훅
export const useAuth = () => useContext(AuthContext);

// ----- 토큰 유틸 (키 단일화 + 과거 호환) -----
const ACCESS_KEY = 'access';
const REFRESH_KEY = 'refresh';
// 과거 코드 호환용(점진 제거 예정)
const ACCESS_KEY_COMPAT = 'accessToken';

function getStoredAccess() {
  return localStorage.getItem(ACCESS_KEY) || localStorage.getItem(ACCESS_KEY_COMPAT) || null;
}
function getStoredRefresh() {
  return localStorage.getItem(REFRESH_KEY) || null;
}
function setTokens(access, refresh, { compat = true } = {}) {
  if (access) {
    localStorage.setItem(ACCESS_KEY, access);
    if (compat) localStorage.setItem(ACCESS_KEY_COMPAT, access); // 구 코드 호환
    // 저장 직후 요청에서도 바로 적용되도록 기본 헤더에 주입
    api.defaults.headers.common.Authorization = `Bearer ${access}`;
  }
  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh);
  }
}
function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(ACCESS_KEY_COMPAT);
  delete api.defaults.headers.common.Authorization;
}

// 3) 프로바이더
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 초기 로딩 상태

  // 내 정보 로드(토큰 저장 직후에도 즉시 동작하도록 accessOverride 지원)
  const loadMe = useCallback(async (accessOverride) => {
    try {
      const headers = accessOverride
        ? { Authorization: `Bearer ${accessOverride}` }
        : undefined;
      const { data } = await api.get('/api/mypage/main/', { headers });
      setUser(data);
      return data;
    } catch (error) {
      console.error('자동 로그인 실패 (유저 정보 불러오기 실패):', error);
      // 실패해도 토큰은 유지 (원래 정책 그대로)
      setUser(null);
      return null;
    }
  }, []);

  // 앱 시작 시: 토큰 있으면 기본 헤더에 즉시 반영 후 유저 정보 불러오기
  useEffect(() => {
    const access = getStoredAccess();
    if (access) {
      api.defaults.headers.common.Authorization = `Bearer ${access}`;
      loadMe(access).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loadMe]);

  // 로그인: 토큰 저장 → 헤더 즉시 반영 → 유저 정보 로드
  const login = useCallback(
    async (accessToken, refreshToken) => {
      setTokens(accessToken, refreshToken, { compat: true }); // compat=true로 임시 호환 유지
      const me = await loadMe(accessToken);
      return me; // 호출부에서 필요시 활용
    },
    [loadMe]
  );

  // 로그아웃
  const logout = useCallback(() => {
    setUser(null);
    clearTokens();
    // 하드 리다이렉트로 상태 깔끔히 초기화
    window.location.replace('/login');
  }, []);

  // 여러 탭 간 토큰/로그인 상태 동기화
  useEffect(() => {
    const onStorage = (e) => {
      if ([ACCESS_KEY, REFRESH_KEY, ACCESS_KEY_COMPAT].includes(e.key)) {
        const access = getStoredAccess();
        if (access) {
          api.defaults.headers.common.Authorization = `Bearer ${access}`;
          // 토큰이 갱신되면 유저 정보도 동기화
          loadMe(access);
        } else {
          setUser(null);
          delete api.defaults.headers.common.Authorization;
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadMe]);

  const value = {
    user,
    // 토큰만 있어도 true (네 정책 유지). 완전 엄격히 하려면 !!user 로 바꿔도 됨.
    isLoggedIn: !!user || !!getStoredAccess(),
    loading,
    login,
    logout,
    setUser, // 프로필 갱신용
  };

  // 로딩 중이면 화면 깜빡임 방지
  if (loading) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
