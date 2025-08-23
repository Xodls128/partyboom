import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PartyHistory.css';
import LeftBlack from '../assets/left_black.svg';
import PartySmallAfter from './PartySmallAfter';
import PartySmallImages from '../assets/partysmall.jpg';
import ReviewModal from './ReviewModal.jsx';        

export default function PartyHistory() {
  const navigate = useNavigate();

  const historyData = [
    { id: 1, title: '#유학생과_언어교류', date: '2025-08-25T18:00:00', location: '주당끼리', thumbnailUrl: PartySmallImages, current: 4, capacity: 5 },
  ];

  // ✅ 모달 상태
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const onOpen = (party) => { setSelected(party); setOpen(true); };
  const onClose = () => setOpen(false);
  const onSubmit = (review) => {
    console.log('리뷰 제출:', { partyId: selected?.id, ...review });
    // 서버로 POST
    setOpen(false);
    alert('리뷰가 제출되었습니다!');
  };

  const goBack = () => navigate(-1);

  return (
    <div className="history-page">
      <header className="history-header">
        <button className="back-button" onClick={goBack}>
          <img src={LeftBlack} alt="back" className="back-icon" />
        </button>
        <h1 className="header-title">참여이력</h1>
      </header>

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
            onClick={() => onOpen(party)}     
          />
        ))}
      </section>

      {/* 리뷰 */}
      <ReviewModal
        open={open}
        onClose={onClose}
        onSubmit={onSubmit}
        partyTitle={selected?.title ?? ''}
      />
    </div>
  );
}