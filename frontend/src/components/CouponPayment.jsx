import './couponpayment.css';

export default function CouponPayment({ isOpen, onClose, showFinishModal }) {
  if (!isOpen) return null;
  
  return (
    <div className="couponpayment-overlay" onClick={onClose}>
      <div className="couponpayment-modal" onClick={e => e.stopPropagation()}>
        <button className="couponpayment-close" onClick={onClose}>X</button>
        <p className="couponpayment-message">파티 무료 참여 쿠폰 1회가 차감됩니다.</p>
        <div className="couponpayment-coupon-info">
          <p className="couponpayment-coupon-label">현재 남은 쿠폰:</p>
          <p className="couponpayment-coupon-value">2</p>
        </div>
        <p className="couponpayment-submessage">참가 신청을 진행하시겠습니까?</p>
        <div className="couponpayment-buttons">
          <button 
            className="couponpayment-no-btn"
            onClick={onClose}
          >
            아니오
          </button>
          <button 
            className="couponpayment-yes-btn"
            onClick={() => {
              onClose(); // 현재 모달 닫기
              showFinishModal(); // 완료 모달 표시
            }}
          >
            예
          </button>
        </div>
      </div>
    </div>
  );
}