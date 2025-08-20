import { useNavigate } from 'react-router-dom';
import Back from '../assets/left_white.svg';
import Party from '../assets/party.jpg';
import Date from '../assets/date.svg';
import Check from '../assets/check.svg';
import Location from '../assets/location.svg';
import Profilesmall from '../assets/profilesmall.svg';
import Apply from '../assets/apply.svg';
import './partyinfo.css';

export default function Partyinfo() {
  const navigate = useNavigate();

  return (
    <>
      <div className="partyinfo-header">
        <img
          src={Party}
          alt="파티 이미지"
          className="partyinfo-img"
          draggable="false"
        />
        <button
          onClick={() => navigate(-1)}
          className="partyinfo-back-button"
          aria-label="뒤로가기"
        >
          <img src={Back} alt="뒤로가기 아이콘" className="partyinfo-back-icon" />
        </button>
      </div>

      <div className='partyinfo-partyName'>#유학생과_언어교류</div>
      <div className='partyinfo-date'>
        <img src={Date} alt="" />
        <span className="partyinfo-dateText">08.25. 18:00</span>
      </div>

      <div className="partyinfo-options-row">
        <div className="partyinfo-option">유학생</div>
        <div className="partyinfo-option">다국어</div>
        <div className="partyinfo-option">문화교류</div>
        <div className="partyinfo-option">술자리</div>
      </div>

      <div className="partyinfo-map-img-wrap">
        <img src={Party} alt="" className="partyinfo-map-img" draggable="false" />
        <div className="partyinfo-location-badge">
          <img src={Location} alt="위치 아이콘" />
          <span>주당끼리</span>
        </div>
      </div>
      <div className="partyinfo-divider"></div>

      <div className='partyinfo-description'>전 세계에서 모인 유학생들이랑 수다 떨고 게임하면서 바로 친해지는 신나는 문화교류 파티!💥
다국어 술게임, 전통 놀이, 토크 시간까지 다양한 이벤트가 기다리고 있어요!
바로 참가 신청해보세요!</div>

      <div className="partyinfo-bottom-bar">
        <div className='partyinfo-person'>
          <img src={Check} alt="" />
          <span className="partyinfo-personText">12/20</span>
          <div className="profile-icons">
            <img src={Profilesmall} alt="프로필1" className="profile-icon" draggable="false" />
            <img src={Profilesmall} alt="프로필2" className="profile-icon" draggable="false" />
            <img src={Profilesmall} alt="프로필3" className="profile-icon" draggable="false" />
            <img src={Profilesmall} alt="프로필4" className="profile-icon" draggable="false" />
            <img src={Profilesmall} alt="프로필5" className="profile-icon" draggable="false" />
          </div>
        </div>
        <button
          className="partyinfo-apply-btn"
          aria-label="팝업 띄우기"
        >
          <img src={Apply} alt="버튼" />
        </button>
      </div>

      <div className='partyinfo-spaceExpansion'></div>
    </>
  );
}
