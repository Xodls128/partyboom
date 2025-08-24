import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from "../api/axios";
import Back from '../assets/left_black.svg';
import './payment.css';

import LoginRequest from "../components/LoginRequest"; // 로그인 모달 임포트

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { participationId } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('point'); // 현재는 포인트만 사용
  const [points, setPoints] = useState(0);
  const [agree, setAgree] = useState(false);
  
  // 로그인 상태 체크
  const token = localStorage.getItem("access");
  const isLoggedIn = !!token;

  if (!isLoggedIn) {
    return (
      <LoginRequest 
        isOpen={true} 
        onClose={() => navigate("/")} 
        redirectTo="/"   // 로그인 성공 후 무조건 홈으로 이동
      />
    );
  }

  const [deposit, setDeposit] = useState(null);

  // 페이지 진입 시 participationId 유효성 검사 및 유저 정보 로딩
  useEffect(() => {
    if (!participationId) {
      alert("예약 정보가 없습니다. 다시 시도해주세요.");
      navigate(-1); // 이전 페이지로 되돌리기
      return;
    }

    const fetchUser = async () => {
      try {
      const { data } = await api.get(`/api/reserve/participation/${participationId}/`);
      setPoints(data.user.points);
      setDeposit(data.party?.deposit ?? 0); // party.deposit 값을 저장
    } catch (err) {
      console.error("예약 정보 불러오기 실패:", err.response?.data || err.message);
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
      const { data } = await api.post(`/api/reserve/pay/${participationId}/`, {
        payment_method: "point",
      });

      alert("결제 완료! 사용 포인트: " + data.amount);
      setPoints(data.remaining_points); // 응답으로 받은 남은 포인트 갱신
      navigate("/paymentfinish"); // 결제 완료 후 이동
    } catch (err) {
      console.error("결제 실패:", err.response?.data || err.message);
      alert(err.response?.data?.detail || "결제 중 오류가 발생했습니다.");
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
          <span className="payment-info-value">
            {deposit !== null ? `${deposit}p` : "로딩중..."}
          </span>
        </div>
        <div className="payment-divider"></div>
        <div className="payment-info-total">
          <span className="payment-info-label">합계</span>
          <span className="payment-info-value">
            {deposit !== null ? `${deposit}p` : "로딩중..."}
          </span>
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
        <button className="payment-btn" onClick={handlePayment} disabled={!agree}>
          결제하기
        </button>
      </div>
    </>
  );
}
