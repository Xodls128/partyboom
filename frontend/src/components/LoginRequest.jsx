import { useNavigate } from 'react-router-dom';
import './loginrequest.css';

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY; 
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

export default function LoginRequest({ isOpen, onClose, redirectTo }) {
  const navigate = useNavigate();
  
  if (!isOpen) return null;

  const handleKakaoLogin = () => {
    // redirectTo 값 저장 (없으면 홈으로)
    if (redirectTo) {
      localStorage.setItem("redirectPath", redirectTo);
    } else {
      localStorage.setItem("redirectPath", "/");
    }

    const kakaoAuthUrl = 
      `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;
    
    console.log("카카오 로그인 URL:", kakaoAuthUrl);

    window.location.href = kakaoAuthUrl;
  };

  const handleEmailLogin = () => {
    navigate('/login');
    onClose();
  };

  const handleSignup = () => {
    navigate('/signup');
    onClose();
  };

  return (
    <div className="loginrequest-overlay" onClick={onClose}>
      <div className="loginrequest-modal" onClick={e => e.stopPropagation()}>
        <button className="loginrequest-close" onClick={onClose}>X</button>
        <p className="loginrequest-message">로그인이 필요한 서비스입니다.</p>
        <p className="loginrequest-submessage">신청을 계속하려면 로그인해주세요.</p>
        <div className="loginrequest-buttons">
          <button className="loginrequest-kakao-btn" onClick={handleKakaoLogin}>
            카카오로 1초 만에 시작하기
          </button>
          <button className="loginrequest-email-btn" onClick={handleEmailLogin}>
            이메일로 로그인
          </button>
          <button className="loginrequest-signup-btn" onClick={handleSignup}>
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
