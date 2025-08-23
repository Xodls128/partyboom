import { useNavigate } from 'react-router-dom';
import CheckCoupon from '../assets/check_coupon.svg';
import './finishcoupon.css';

export default function FinishCoupon({ isOpen, onClose, onConfirm }) {
  const navigate = useNavigate();
  
  if (!isOpen) return null;
  
  return (
    <div className="finishcoupon-overlay" onClick={onClose}>
      <div className="finishcoupon-modal" onClick={e => e.stopPropagation()}>
        <button className="finishcoupon-close" onClick={onClose}>X</button>
        <div className="finishcoupon-check-icon">
          <img src={CheckCoupon} alt="예약 완료" />
        </div>
        <p className="finishcoupon-message">예약이 완료되었습니다.</p>

        <div className="finishcoupon-buttons">
          <button 
            className="finishcoupon-no-btn"
            onClick={() => {
              navigate('/');
              onClose();
            }}
          >
            홈으로
          </button>
          <button 
            className="finishcoupon-yes-btn"
            onClick={() => {
              navigate('/assist');
              onClose();
            }}
          >
            내 예약 보기
          </button>
        </div>
      </div>
    </div>
  );
}