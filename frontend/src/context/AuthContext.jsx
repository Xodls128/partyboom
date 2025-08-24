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
    // 즉시 실행 함수(IIFE)를 사용하여 비동기 로직 처리
    (async () => {
      const token = localStorage.getItem('access');
      if (token) {
        try {
          const { data } = await api.get('/api/mypage/');
          setUser(data);
        } catch (error) {
          console.error("자동 로그인 실패:", error);
          // 토큰이 유효하지 않으면 삭제
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
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
      const { data } = await api.get('/api/mypage/');
      setUser(data);
      // 추가 정보 입력 여부에 따라 적절한 페이지로 이동시키는 로직은
      // 로그인 컴포넌트(Login, KakaoCallbackPage)에서 처리하는 것이 더 적합합니다.
      return data; // 사용자 정보를 반환하여 후속 처리에 사용
    } catch (error) {
      console.error("로그인 후 사용자 정보 가져오기 실패:", error);
      setUser(null); // 실패 시 확실하게 null로 설정
      throw error; // 에러를 다시 던져서 호출한 쪽에서 처리하도록 함
    }
  };

  // 로그아웃 함수
  const logout = () => {
    setUser(null);
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    // 필요하다면 로그인 페이지로 리디렉션
    window.location.href = '/login';
  };

  const value = {
    user,
    isLoggedIn: !!user,
    loading,
    login,
    logout,
  };

  // 로딩 중에는 아무것도 렌더링하지 않아, 불완전한 상태가 보이는 것을 방지
  if (loading) {
    return null; // 또는 로딩 스피너를 보여줄 수 있습니다.
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
