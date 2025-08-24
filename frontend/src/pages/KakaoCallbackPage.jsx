import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext'; // useAuth 훅 임포트

function KakaoCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth(); // AuthContext의 login 함수 사용

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    const handleKakaoLogin = async (authCode) => {
      try {
        const res = await api.post('/api/signup/auth/kakao/', {
          code: authCode,
          redirect_uri: import.meta.env.VITE_KAKAO_REDIRECT_URI,
        });
        
        const { access, refresh } = res.data;

        // Context의 login 함수 호출 (토큰 저장 및 유저 정보 로드)
        await login(access, refresh);

        // 로그인 성공 후 홈으로 이동
        navigate("/");
      } catch (err) {
        console.error("카카오 로그인 처리 중 에러 발생:", err);
        alert("로그인에 실패했습니다. 문제가 지속되면 관리자에게 문의하세요.");
        navigate("/login");
      }
    };

    if (code) {
      handleKakaoLogin(code);
    } else {
      const error = params.get('error');
      console.error("카카오 인증 실패:", error);
      alert("카카오 인증에 실패했습니다. 로그인 페이지로 돌아갑니다.");
      navigate("/login");
    }
  }, [location, navigate, login]); // login 함수를 의존성 배열에 추가

  return (
    <div>
      <h1>카카오 로그인 처리 중...</h1>
      <p>잠시만 기다려주세요.</p>
    </div>
  );
}

export default KakaoCallbackPage;
