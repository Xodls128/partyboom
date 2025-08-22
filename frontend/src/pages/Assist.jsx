import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
// npm install react-swipeable <- 설치해야 합니다.
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
  
  // 더미 파티 데이터 (나중에 백엔드 API로 교체)
  const parties = [
    {
      id: 1,
      name: '#유학생과_언어교류',
      image: Party,
      location: '주당끼리',
      date: '08.25. 18:00',
      current: 12,
      total: 20,
      countdown: '1일 12시간 29:35'
    },
    {
      id: 2,
      name: '#금요일_저녁_칵테일파티',
      image: Party,
      location: '칵테일바',
      date: '08.26. 19:30',
      current: 8,
      total: 15,
      countdown: '2일 8시간 15:22'
    },
    {
      id: 3,
      name: '#주말_브런치_모임',
      image: Party,
      location: '카페거리',
      date: '08.27. 11:00',
      current: 5,
      total: 10,
      countdown: '3일 2시간 45:10'
    }
  ];

  const [currentPartyIndex, setCurrentPartyIndex] = useState(0);
  const currentParty = parties[currentPartyIndex];

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentPartyIndex < parties.length - 1) {
        setCurrentPartyIndex(currentPartyIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (currentPartyIndex > 0) {
        setCurrentPartyIndex(currentPartyIndex - 1);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  return (
    <>
      <div className="assist-countdown">
        <div className="assist-countdown-text">파티 시작까지</div>
        <div className="assist-countdown-row">
          <div className="assist-countdown-time">{currentParty.countdown}</div>
          <img src={Assistbomb} alt="도움 요청 폭탄" className="assist-bomb" />
        </div>
        <div className="assist-countdown-text">남았어요!</div>
      </div>

      <div className="assist-indicators">
        {parties.map((party, idx) => (
          <div 
            key={party.id}
            className={`assist-indicator ${idx === currentPartyIndex ? 'assist-indicator-active' : ''}`}
            onClick={() => setCurrentPartyIndex(idx)}
          />
        ))}
      </div>

      <div {...handlers} className="assist-party-container">
        <div className='assist-party-block'>
          <div className="assist-party-img-wrap">
            <img src={currentParty.image} alt="" className="assist-party-img" draggable="false" />
            <div className="assist-location-badge">
              <img src={Location} alt="위치 아이콘" />
              <span>{currentParty.location}</span>
            </div>
          </div>

          <div className='assist-partyName'>{currentParty.name}</div>
          <div className='assist-date'>
            <img src={Date} alt="" />
            <span className="assist-dateText">{currentParty.date}</span>
          </div>
          <div className='assist-person'>
            <img src={Check} alt="" />
            <span className="assist-dateText">{currentParty.current}/{currentParty.total}</span>
          </div>
          <div className="assist-profile-icons">
            <img src={Profilesmall} alt="프로필1" className="assist-profile-icon" draggable="false" />
            <img src={Profilesmall} alt="프로필2" className="assist-profile-icon" draggable="false" />
            <img src={Profilesmall} alt="프로필3" className="assist-profile-icon" draggable="false" />
            <img src={Profilesmall} alt="프로필4" className="assist-profile-icon" draggable="false" />
            <img src={Profilesmall} alt="프로필5" className="assist-profile-icon" draggable="false" />
          </div>
        </div>
      </div>
      <NavBar />
    </>
  );
}
