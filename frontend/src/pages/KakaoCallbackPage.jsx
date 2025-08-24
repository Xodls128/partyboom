import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function KakaoCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

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

        // 토큰 저장 및 유저 정보 로드
        await login(access, refresh);

        // 로그인 성공 → 홈으로 이동
        navigate("/");
      } catch (err) {
        console.error("카카오 로그인 처리 중 에러 발생:", err);

        // 진짜 서버 오류(500 이상)일 때만 로그인 실패 처리
        if (err.response && err.response.status >= 500) {
          alert("서버 오류로 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
          navigate("/login");
        } else {
          // 그 외의 경우는 토큰이 저장됐을 가능성이 있으므로 홈으로 이동
          navigate("/");
        }
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
  }, [location, navigate, login]);

  return (
    <div>
      <h1>카카오 로그인 처리 중...</h1>
      <p>잠시만 기다려주세요.</p>
    </div>
  );
}

export default KakaoCallbackPage;
