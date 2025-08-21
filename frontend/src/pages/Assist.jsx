import NavBar from '../components/NavBar';
import Assistbomb from '../assets/assistbomb.svg';
import Party from '../assets/party.jpg';
import Location from '../assets/location.svg';
import Date from '../assets/date.svg';
import Check from '../assets/check.svg';
import Profilesmall from '../assets/profilesmall.svg';
import './assist.css';
import { useNavigate } from 'react-router-dom';

export default function Assist() {
  const navigate = useNavigate();

  return (
    <>
      <div className="assist-countdown">
        <div className="assist-countdown-text">파티 시작까지</div>
        <div className="assist-countdown-row">
          <div className="assist-countdown-time">1일 12시간 29:35</div>
          <img src={Assistbomb} alt="도움 요청 폭탄" className="assist-bomb" />
        </div>
        <div className="assist-countdown-text">남았어요!</div>
      </div>

      <div className='assist-party-block'>
        <div
          className="assist-party-img-wrap"
          onClick={() => navigate('/balancewait')}
          style={{ cursor: 'pointer' }}
        >
          <img src={Party} alt="" className="assist-party-img" draggable="false" />
          <div className="assist-location-badge">
            <img src={Location} alt="위치 아이콘" />
            <span>주당끼리</span>
          </div>
        </div>

        <div className='assist-partyName'>#유학생과_언어교류</div>
        <div className='assist-date'>
          <img src={Date} alt="" />
          <span className="assist-dateText">08.25. 18:00</span>
        </div>
        <div className='assist-person'>
          <img src={Check} alt="" />
          <span className="assist-dateText">12/20</span>
        </div>
        <div className="assist-profile-icons">
          <img src={Profilesmall} alt="프로필1" className="assist-profile-icon" draggable="false" />
          <img src={Profilesmall} alt="프로필2" className="assist-profile-icon" draggable="false" />
          <img src={Profilesmall} alt="프로필3" className="assist-profile-icon" draggable="false" />
          <img src={Profilesmall} alt="프로필4" className="assist-profile-icon" draggable="false" />
          <img src={Profilesmall} alt="프로필5" className="assist-profile-icon" draggable="false" />
        </div>
      </div>
      <NavBar />
    </>
  );
}
