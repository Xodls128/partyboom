import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;
const BACKEND_KAKAO_LOGIN_URL = `${API_BASE}/api/signup/auth/kakao/`;

function KakaoCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('카카오 로그인 처리 중...');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      setMessage(`카카오 로그인 오류: ${error}`);
      return;
    }

    if (code) {
      axios.post(BACKEND_KAKAO_LOGIN_URL, {
        code: code,
        redirect_uri: KAKAO_REDIRECT_URI,
      })
      .then(res => {
        const data = res.data;
        if (data.access && data.refresh) {
          // 토큰 저장
          localStorage.setItem('access', data.access);
          localStorage.setItem('refresh', data.refresh);

          // axios 기본 헤더 등록
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;

          setMessage('카카오 로그인 성공!');

          // 로그인 전 원래 가려던 페이지 가져오기
          const redirectPath = localStorage.getItem("redirectPath") || "/";
          localStorage.removeItem("redirectPath");
          navigate(redirectPath, { replace: true });
        } else {
          setMessage(`로그인 실패: ${data.detail || JSON.stringify(data)}`);
        }
      })
      .catch(error => {
        setMessage(`백엔드 통신 오류: ${error.message}`);
        console.error('백엔드 통신 오류:', error);
      });
    } else {
      setMessage('카카오 인증 코드를 받지 못했습니다.');
    }
  }, [location, navigate]);

  return (
    <div>
      <h1>카카오 로그인 콜백</h1>
      <p>{message}</p>
    </div>
  );
}

export default KakaoCallbackPage;
