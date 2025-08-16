import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Mypage.css';
import Header from '../components/Header.jsx';
import NavBar from '../components/NavBar.jsx';

import Vector from '../assets/Vector.svg';
import Info from '../assets/info.svg';
import RigthBlack from '../assets/right_black.svg';

export default function Mypage() {
  const navigate = useNavigate();

  //포인트 창 
  const [isTooltipVisible, setIsTooltipVisible] = useState(false); 
  const onTooltipClick = () => { setIsTooltipVisible(!isTooltipVisible); };
  // 경고창
  const [isWarningTooltipVisible, setIsWarningTooltipVisible] = useState(false); 
  const onWarningTooltipClick = () => { setIsWarningTooltipVisible(!isWarningTooltipVisible);};

  const handleParticipationClick = () => {navigate('/mypage/history');};

  return (
    <>
      <Header/>
      <div className="profile-page">
        {/* 1. 프로필 정보 섹션: 프로필 사진, 이름, 한 줄 소개, 태그 */}
        <section className="profile-info">
          <div className="profile-photo-group">
            <div className="profile-image-wrap">
              <img src={Vector} alt="프로필 이미지" className="profile-image-svg" />
            </div>
            <div className="button-group">
              <button className="edit-button">수정하기</button>
            </div>
          </div>

          <div className="profile-details">
            <div className='name-and-intro-container'>
              <p className="profile-name">9100</p>
              <p className="profile-perinfo">파티붐 화이팅! 다들 반가워요!</p>
            </div>  
            <div className="profile-tags">
              <span className="profile-tag">3학년</span>
              <span className="profile-tag">조형대학</span>
              <span className="profile-tag">주도적인</span>
              <span className="profile-tag">INTP</span>
            </div>
          </div>
        </section>

        {/* 2. 포인트 정보 섹션 */}
        <section className="point-section">
          <p>포인트</p>
          <div className="point-value-group">
            <p>10,000P</p>
            <img src={Info} alt="info 이미지" className="info-image-svg" onClick={onTooltipClick}/>
          </div>
          {isTooltipVisible && (
            <div className="tooltip">
              <p>포인트는 파티붐 서비스 활동을 통해<br />획득하거나 사용할 수 있는 재화입니다.</p>
            </div>
          )}
        </section>

        {/* 3. 참여 횟수 및 경고 섹션 */}
        <section className="profile-stats">
          <div className="stat-item" onClick={handleParticipationClick}>
            <p>참여횟수</p>
            <p className='stat-value'>4 <img src={RigthBlack} alt="right 이미지" className="right-image-svg"/></p>
          </div>
          <div className="stat-item">
            <p>경고</p>
            <p className='stat-value' onClick={onWarningTooltipClick}>
              0 
              <img src={Info} alt="info 이미지" className="info-image-svg"/>
            </p>
            {isWarningTooltipVisible && (
              <div className="tooltip warning-tooltip">
                <p>경고는 서비스 이용 규칙을 위반했을 때 부여됩니다.</p>
              </div>
            )}
          </div>
        </section>

        {/* 4. 설정 메뉴 목록 섹션 */}
        <section className="profile-menu">
          <ul className="menu-list">
            <li>도움말</li>
            <li>로그아웃</li>
            <li className='delete_account'>계정 탈퇴</li>
          </ul>
        </section>
        
      </div>
      <NavBar/>
    </>  
  );
}