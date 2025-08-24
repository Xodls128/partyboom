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
        
        const { access, refresh, is_additional_info_provided } = res.data;

        // localStorage에 직접 저장하는 대신, context의 login 함수 호출
        await login(access, refresh);

        // login 함수가 사용자 정보를 context에 저장하면,
        // is_additional_info_provided 값에 따라 페이지 이동
        if (is_additional_info_provided) {
          navigate("/");
        } else {
          navigate("/mypage/extra");
        }
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
