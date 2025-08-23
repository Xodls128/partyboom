import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';  // location에서 participationId 받는다고 가정
import Back from '../assets/left_black.svg';
import Party from '../assets/party.jpg';
import Date from '../assets/date.svg';
import Check from '../assets/check.svg';
import Location from '../assets/location.svg';
import Profilesmall from '../assets/profilesmall.svg';
import Apply from '../assets/apply.svg';
import './payment.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { participationId } = location.state || {}; // 이전 페이지에서 넘겨받음

  const [paymentMethod, setPaymentMethod] = useState('point'); // 현재는 포인트만 사용
  const [points, setPoints] = useState(0);
  const [agree, setAgree] = useState(false);


  // 페이지 진입 시 participationId 유효성 검사
  useEffect(() => {
    if (!participationId) {
      alert("예약 정보가 없습니다. 다시 시도해주세요.");
      navigate(-1); // 이전 페이지로 되돌리기
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/me/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access")}` }
        });
        if (!res.ok) throw new Error("유저 정보 불러오기 실패");
        const data = await res.json();
        setPoints(data.points);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [participationId, navigate]);

  // 결제 처리
  const handlePayment = async () => {
    if (!agree) {
      alert("환불 정책에 동의해야 결제할 수 있습니다.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/reserve/pay/${participationId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`
        },
        body: JSON.stringify({ payment_method: "point" })
      });

      if (!res.ok) throw new Error("결제 실패");
      const data = await res.json();

      alert("결제 완료! 사용 포인트: " + data.amount);
      setPoints(data.remaining_points); // 응답으로 받은 남은 포인트 갱신
      navigate("/"); // 결제 후 이동 (홈으로 설정해놨는데 추후에 어시스트로 이동되게바꿔야함)
    } catch (err) {
      console.error(err);
      alert("결제 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      <div className="payment-header">
        <button
          onClick={() => navigate(-1)}
          className="payment-back-button"
          aria-label="뒤로가기"
        >
          <img src={Back} alt="뒤로가기 아이콘" className="payment-back-icon" />
        </button>
        <span className="payment-title">예약금 결제</span>
      </div>

      <div className="payment-info-box">
        <div className="payment-info-row">
          <span className="payment-info-label">파티 참여 비용</span>
          <span className="payment-info-value">무료</span>
        </div>
        <div className="payment-info-row">
          <span className="payment-info-label">예약금</span>
          <span className="payment-info-value">2000p</span>
        </div>
        <div className="payment-divider"></div>
        <div className="payment-info-total">
          <span className="payment-info-label">합계</span>
          <span className="payment-info-value">2000p</span>
        </div>
      </div>

      <div className="payment-method-box">
        <div className="payment-method-title">결제 수단</div>
        <div className={`payment-method-option ${paymentMethod === 'point' ? 'payment-method-selected' : ''}`}>
          <label className="payment-method-radio-label">
            <input 
              type="radio" 
              name="paymentMethod" 
              value="point" 
              checked={paymentMethod === 'point'} 
              onChange={() => setPaymentMethod('point')} 
              className="payment-method-radio"
            />
            <span className="payment-method-label">포인트 차감</span>
          </label>
          <div className="payment-method-value-wrap">
            <span className="payment-method-point">잔여 포인트</span>
            <span className="payment-method-value">{points}P</span>
          </div>
        </div>
      </div>

      <div className="payment-bottom-bar">
        <div className="payment-agree-row">
          <input 
            type="checkbox" 
            id="agree" 
            checked={agree}
            onChange={() => setAgree(!agree)}
          />
          <span className="payment-agree">환불 정책을 확인하였으며 이에 동의합니다.</span>
        </div>
        <button className="payment-btn" onClick={handlePayment}>
          결제하기
        </button>
      </div>
    </>
  );
}
