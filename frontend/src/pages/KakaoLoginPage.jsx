import React from 'react';
const API_BASE = import.meta.env.VITE_API_URL;
const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY; 
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

function KakaoLoginPage() {
  const handleKakaoLogin = () => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  return (
    <div>
      <h1>카카오 로그인</h1>
      <button onClick={handleKakaoLogin}>카카오 로그인 시작</button>
    </div>
  );
}

export default KakaoLoginPage;
