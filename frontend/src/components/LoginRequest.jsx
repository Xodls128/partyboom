import { useNavigate } from 'react-router-dom';
import './loginrequest.css';

export default function LoginRequest({ isOpen, onClose }) {
  const navigate = useNavigate();
  
  if (!isOpen) return null;

  const handleKakaoLogin = () => {
    navigate('/kakao-login');
    onClose();
  };
  
  return (
    <div className="loginrequest-overlay" onClick={onClose}>
      <div className="loginrequest-modal" onClick={e => e.stopPropagation()}>
        <button className="loginrequest-close" onClick={onClose}>X</button>
        <p className="loginrequest-message">로그인이 필요한 서비스입니다.</p>
        <p className="loginrequest-submessage">신청을 계속하려면 로그인해주세요.</p>
        <div className="loginrequest-buttons">
          <button 
            className="loginrequest-login-btn"
            onClick={handleKakaoLogin} // 카카오 로그인 페이지로 이동하는 함수 호출
          >
            카카오 로그인
          </button>
          <button 
            className="loginrequest-signup-btn"
            onClick={() => navigate('/signup')}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}