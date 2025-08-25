// src/pages/KakaoCallbackPage.jsx
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function KakaoCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const onceRef = useRef(false); // StrictMode 중복 실행 방지

  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;

    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      console.error('카카오 인증 실패:', error);
      alert('카카오 인증에 실패했습니다. 로그인 페이지로 돌아갑니다.');
      navigate('/login', { replace: true });
      return;
    }
    if (!code) {
      alert('카카오 인증 코드가 없습니다.');
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      try {
        const redirectUri =
          import.meta.env.VITE_KAKAO_REDIRECT_URI ||
          (window.location.origin + location.pathname);

        const res = await api.post('/api/signup/auth/kakao/', {
          code,
          redirect_uri: redirectUri,
        });

        const { access, refresh, is_additional_info_provided } = res.data || {};
        if (!access || !refresh) throw new Error('토큰 발급 실패');

        // 토큰 저장 및 유저 로드 (AuthContext에 맞춰 유지)
        await login(access, refresh);

        // 추가정보 여부에 따라 분기(없으면 추가정보 페이지로)
        navigate(is_additional_info_provided ? '/' : '/mypage/additional', {
          replace: true,
        });
      } catch (err) {
        console.error('카카오 로그인 처리 중 에러:', err);

        const status = err?.response?.status;
        const detail =
          err?.response?.data?.detail || err?.response?.data?.message;

        if (status >= 500) {
          alert(detail || '서버 오류로 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.');
          navigate('/login', { replace: true });
        } else if (status === 400 || status === 401) {
          // 인증/요청 문제: 토큰 저장이 안됐을 가능성 높음
          alert(detail || '로그인에 실패했습니다. 다시 시도해주세요.');
          navigate('/login', { replace: true });
        } else {
          // 간헐/비정형 응답: 홈으로 보내고 전역 가드에서 재확인
          navigate('/', { replace: true });
        }
      }
    })();
  }, [location.pathname, location.search, navigate, login]);

  return (
    <div>
      <h1>카카오 로그인 처리 중...</h1>
      <p>잠시만 기다려주세요.</p>
    </div>
  );
}

export default KakaoCallbackPage;
