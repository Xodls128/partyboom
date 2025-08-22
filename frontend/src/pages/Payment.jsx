import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [paymentMethod, setPaymentMethod] = useState('coupon'); // 기본값은 쿠폰
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/me/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access")}` }
        });
        if (!res.ok) throw new Error("유저 정보 불러오기 실패");
        const data = await res.json();
        setPoints(data.points);  // 이제 백엔드에서 받아온 points 반영
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

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

      <div className="payment-desc-box">
        <div className="payment-desc-title">*예약금은 무분별한 예약 취소를 방지하고, 가게와의 제휴 할인을 위한 비용입니다.</div>
        <div className="payment-desc-policy">
          <b>환불 정책</b><br />
          파티 시작 이전에 파티 참여를 취소하는 경우, 다음과 같은 환불 정책이 적용됩니다.<br />
          - 파티 시작 24시간 전: 전액 환불<br />
          - 파티 시작 24시간 이내: 50% 환불<br />
          - 파티 시작 이후: 환불 불가
        </div>
      </div>

      <div className="payment-method-box">
        <div className="payment-method-title">결제 수단</div>
        <div className={`payment-method-option ${paymentMethod === 'coupon' ? 'payment-method-selected' : ''}`}>
          <label className="payment-method-radio-label">
            <input 
              type="radio" 
              name="paymentMethod" 
              value="coupon" 
              checked={paymentMethod === 'coupon'} 
              onChange={() => setPaymentMethod('coupon')} 
              className="payment-method-radio"
            />
            <span className="payment-method-label">파티 무료 참여 쿠폰</span>
          </label>
          <div className="payment-method-value-wrap">
            <span className="payment-method-coupon">잔여 쿠폰</span>
            <span className="payment-method-value">3</span>
          </div>
        </div>
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
        <div className="payment-method-option payment-method-disabled">
          <label className="payment-method-radio-label">
            <input 
              type="radio" 
              name="paymentMethod" 
              value="card" 
              disabled
              className="payment-method-radio"
            />
            <span className="payment-method-card">카드 결제</span>
          </label>
          <div className="payment-method-value-wrap">
            <span className="payment-method-card-value">준비 중인 기능이에요</span>
          </div>
        </div>
      </div>

      <div className="payment-bottom-bar">
        <div className="payment-agree-row">
          <input type="checkbox" id="agree" />
          <span className="payment-agree">환불 정책을 확인하였으며 이에 동의합니다.</span>
        </div>
        <button className="payment-btn">결제하기</button>
      </div>
    </>
  );
}
