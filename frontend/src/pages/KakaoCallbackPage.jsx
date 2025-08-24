import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios'; // 올바른 api 인스턴스 임포트

function KakaoCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    // useEffect 내에서 사용할 async 함수 선언
    const handleKakaoLogin = async (authCode) => {
      try {
        // 백엔드에 인증 코드와 redirect_uri를 함께 전송
        const res = await api.post('/api/signup/kakao/callback/', {
          code: authCode,
          // 환경 변수(.env)에 저장된 고정된 URI 값을 사용합니다.
          redirect_uri: import.meta.env.VITE_KAKAO_REDIRECT_URI,
        });
        
        const { access, refresh, is_additional_info_provided } = res.data;

        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);

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
  }, [location, navigate]);

  // 처리 중임을 사용자에게 보여주는 UI
  return (
    <div>
      <h1>카카오 로그인 처리 중...</h1>
      <p>잠시만 기다려주세요.</p>
    </div>
  );
}

export default KakaoCallbackPage;