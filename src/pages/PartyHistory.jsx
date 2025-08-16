import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PartyHistory.css';
import LeftBlack from '../assets/left_black.svg';
import PartySmallAfter from './PartySmallAfer';
import PartySmallImages from '../assets/partysmall.jpg';

export default function PartyHistory() {
  const navigate = useNavigate();

  const historyData = [
    {
      id: 1,
      title: '#유학생과_언어교류',
      date: '2025-08-25',
      location: '주당끼리',
      thumbnailUrl: PartySmallImages,
      current: 4,
      capacity: 5
    },
  ];

  const goBack = () => {
    navigate(-1); // 이전 페이지로 이동
  };

  return (
    <div className="history-page">
      <header className="history-header">
        <button className="back-button" onClick={goBack}>
          <img src={LeftBlack} alt="back" className="back-icon" />
        </button>
        <h1 className="header-title">참여이력</h1>
      </header>
      
      {/* 참여 내역 목록 */}
      <section className="history-list">
        {historyData.map((party) => (
          <PartySmallAfter
            key={party.id}
            title={party.title}
            date={party.date}
            location={party.location}
            thumbnailUrl={party.thumbnailUrl}
            current={party.current}
            capacity={party.capacity}
            onClick={() => console.log('리뷰 남기기 클릭')}
          />
        ))}
      </section>
    </div>
  );
}