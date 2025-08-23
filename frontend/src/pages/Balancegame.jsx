import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Back from '../assets/left_black.svg';
import Vs from '../assets/vs.svg';
import './balancegame.css';

export default function Balancegame() {
  const navigate = useNavigate();
  const total = 20; // 파티 총 인원
  const [redCount, setRedCount] = useState(8); // 임시 빨간 버튼 누른 인원
  const [yellowCount, setYellowCount] = useState(12); // 임시 노란 버튼 누른 인원

  const handleRed = () => {
    if (redCount + yellowCount < total) setRedCount(redCount + 1);
  };
  const handleYellow = () => {
    if (redCount + yellowCount < total) setYellowCount(yellowCount + 1);
  };

  const redPercent = Math.round((redCount / total) * 100);
  const yellowPercent = Math.round((yellowCount / total) * 100);

  return (
    <>
      <div className="balancegame-header">
        <button
          onClick={() => navigate('/')}
          className="balancegame-back-button"
          aria-label="뒤로가기"
        >
          <img src={Back} alt="뒤로가기 아이콘" className="balancegame-back-icon" />
        </button>
      </div>
      <div className='balancegame-title'>둘 중 하나만 선택해야 한다면?!</div>

      <div className="balancegame-block-red">
        <button
          className="balancegame-btn-red"
          onClick={handleRed}
        >
          <span className="balancegame-red-text">평생동안 백수로<br />월 250만원 받기</span>
        </button>
      </div>

      <div className="balancegame-vs-wrap">
        <img src={Vs} alt="VS" className="balancegame-vs-img" />
      </div>
      
      <div className="balancegame-block-yellow">
        <button
          className="balancegame-btn-yellow"
          onClick={handleYellow}
        >
          <span className="balancegame-yellow-text">평생동안 직장인으로<br />월 1000만원 받기<br />(연차 없음)</span>
        </button>
      </div>

      <div className='balancegame-status'>밸런스 현황</div>
      <div className="balancegame-gauge-wrap">
        <div className="balancegame-gauge-bar">
          <div
            className="balancegame-gauge-red"
            style={{ width: `${redPercent}%` }}
          >
            {redPercent > 10 && <span className="balancegame-gauge-text">{redCount}명 ({redPercent}%)</span>}
          </div>
          <div
            className="balancegame-gauge-yellow"
            style={{ width: `${yellowPercent}%` }}
          >
            {yellowPercent > 10 && <span className="balancegame-gauge-text">{yellowCount}명 ({yellowPercent}%)</span>}
          </div>
        </div>
        <div className="balancegame-gauge-total">{redCount + yellowCount} / {total}명 참여</div>
      </div>

    </>
  );
}
