import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

// 1. 컨텍스트 생성
const AuthContext = createContext(null);

// 2. 컨텍스트를 사용하기 쉽게 만들어주는 커스텀 훅
export const useAuth = () => useContext(AuthContext);

// 3. 컨텍스트를 제공하는 프로바이더 컴포넌트
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 초기 로딩 상태

  // 앱 시작 시 토큰 확인하여 사용자 정보 가져오기
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('access');
      if (token) {
        try {
          const { data } = await api.get('/api/mypage/main/');
          setUser(data);
        } catch (error) {
          console.error("자동 로그인 실패 (유저 정보 불러오기 실패):", error);
          // 실패해도 토큰은 그대로 두고 로그인 상태 유지
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  // 로그인 함수
  const login = async (accessToken, refreshToken) => {
    localStorage.setItem('access', accessToken);
    localStorage.setItem('refresh', refreshToken);
    try {
      // 토큰 저장 직후에는 인터셉터가 바로 반영되지 않을 수 있음
      // → 직접 Authorization 헤더를 넣어서 안전하게 호출
      const { data } = await api.get('/api/mypage/main/', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUser(data);
      return data;
    } catch (error) {
      console.error("로그인 후 사용자 정보 가져오기 실패:", error);
      // 실패해도 로그인은 유지
      setUser(null);
      return null;
    }
  };

  // 로그아웃 함수
  const logout = () => {
    setUser(null);
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    window.location.href = '/login';
  };

  const value = {
    user,
    isLoggedIn: !!user || !!localStorage.getItem('access'), // 토큰만 있어도 로그인 상태 true
    loading,
    login,
    logout,
  };

  // 로딩 중에는 아무것도 렌더링하지 않아
  if (loading) {
    return null; // 또는 로딩 스피너를 보여줄 수 있습니다.
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
