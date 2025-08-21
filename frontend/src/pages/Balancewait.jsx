import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Profilesmall from '../assets/profilesmall.svg';
import './balancewait.css';

export default function Balancewait() {
  const [showOverlay, setShowOverlay] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <div className="balancewait-title">
        <div className="balancewait-partyname">#유학생과_언어교류</div>
        <div className="balancewait-partyname">파티가 진행 중이에요!</div>
      </div>

      <div style={{ position: 'relative', width: '343px', margin: '32px auto 0 auto' }}>
        <button
          className="balancewait-join-btn"
          onClick={() => setShowOverlay(true)}
        >
          <span className="balancewait-join-text">밸런스게임<br />참여하기</span>
        </button>
        {showOverlay && (
          <div className="balancewait-join-overlay">
            <span className="balancewait-join-text">대기중...<br />12/20</span>
          </div>
        )}
      </div>

      <div className="balancewait-profile-icons">
        <img src={Profilesmall} alt="프로필1" className="balancewait-profile-icon" draggable="false" />
        <img src={Profilesmall} alt="프로필2" className="balancewait-profile-icon" draggable="false" />
        <img src={Profilesmall} alt="프로필3" className="balancewait-profile-icon" draggable="false" />
        <img src={Profilesmall} alt="프로필4" className="balancewait-profile-icon" draggable="false" />
        <img src={Profilesmall} alt="프로필5" className="balancewait-profile-icon" draggable="false" />
      </div>

      <div className="balancewait-participants-link-wrap">
        <button
          className="balancewait-participants-link"
          onClick={() => navigate('/participants')}
        >
          참여자 프로필 보기→
        </button>
      </div>

      <NavBar />
    </>
  );
}
