import './finishpoint.css';

export default function FinishPoint({ isOpen, amount, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="finishpoint-overlay">
      <div className="finishpoint-modal">
        <p className="finishpoint-message">결제 완료! 사용 포인트: {amount}</p>
        <div className="finishpoint-buttons">
          <button 
            className="finishpoint-confirm-btn"
            onClick={onConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}