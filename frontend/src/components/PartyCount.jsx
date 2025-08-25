import './partycount.css';

export default function PartyCount({ isOpen, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="partycount-overlay">
      <div className="partycount-modal">
        <p className="partycount">해당 날짜 파티 신청 수가 초과되었습니다!</p>
        <div className="partycount-buttons">
          <button 
            className="partycount-confirm-btn"
            onClick={onConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}