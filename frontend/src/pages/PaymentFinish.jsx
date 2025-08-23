import { useNavigate} from 'react-router-dom';
import './paymentfinish.css';

import LeftIcon from '../assets/left_black.svg';
import CheckIcon from '../assets/check_circle.svg';

export default function PaymentFinish() {
  const nav = useNavigate();
  const goConfirm = () => {
    // 완료 후 파티보조로
    nav('/assist', { replace: true });
  };

  return (
    <div className="paymentfinish-done-page">
      <header className="paymentfinish-done-top">
        <button type="button" className="paymentfinish-done-back" onClick={() => nav(-1)} aria-label="뒤로가기">
          <img src={LeftIcon} alt="" />
        </button>
      </header>

      <main className="paymentfinish-done-center">
        <img src={CheckIcon} alt="" className="paymentfinish-done-check" />
        <p className="paymentfinish-done-title">예약이 완료되었어요!</p>
      </main>

      <div className="paymentfinish-done-actions">
        <button type="button" className="paymentfinish-done-btn" onClick={goConfirm}>확인</button>
      </div>
    </div>
  );
}