import { useNavigate } from 'react-router-dom';
import './pointpayment.css';

export default function PointPayment({ isOpen, onClose, onConfirm }) {
  const navigate = useNavigate();
  
  if (!isOpen) return null;
  
  return (
    <div className="pointpayment-overlay" onClick={onClose}>
      <div className="pointpayment-modal" onClick={e => e.stopPropagation()}>
        <button className="pointpayment-close" onClick={onClose}>X</button>
        <p className="pointpayment-message">예약금 결제를 진행합니다.</p>
        <div className="pointpayment-coupon-info">
          <p className="pointpayment-coupon-label">파티 참여를 위해 예약금</p>
          <p className="pointpayment-coupon-value">2000</p>
          <p className="pointpayment-coupon-label2">p가 차감됩니다.</p>
        </div>
        <p className="pointpayment-submessage">참가 신청을 진행하시겠습니까?</p>
        <div className="pointpayment-buttons">
          <button 
            className="pointpayment-no-btn"
            onClick={onClose}
          >
            아니오
          </button>
          <button 
            className="pointpayment-yes-btn"
            onClick={() => {
              navigate('/payment'); // Payment.jsx로 이동
              onClose();
              if (onConfirm) onConfirm();
            }}
          >
            예
          </button>
        </div>
      </div>
    </div>
  );
}