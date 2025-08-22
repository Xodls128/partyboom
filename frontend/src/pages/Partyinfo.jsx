import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Back from "../assets/left_white.svg";
import UserIcon from '../assets/profilesmall.svg'; // 올바른 기본 아이콘 import
import DefaultPartyImage from '../assets/party.jpg'; // 기본 파티 이미지 import
import DateIcon from '../assets/date.svg';
import "./partyinfo.css";
import CheckIcon from '../assets/check.svg';

export default function Partyinfo() {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartyDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://127.0.0.1:8000/api/detailview/parties/${partyId}/`);
        if (!response.ok) {
          throw new Error('파티 정보를 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setParty(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPartyDetails();
  }, [partyId]);

  if (loading) {
    return <div className="party-info-container">로딩 중...</div>;
  }

  if (error) {
    return <div className="party-info-container">에러: {error}</div>;
  }

  if (!party) {
    return null; 
  }

  const { 
    title, 
    start_time, 
    place, 
    participant_count, 
    max_participants, 
    description, 
    tags, 
    participations 
  } = party;

  return (
    <div className="party-info-container">
      <header className="party-info-header">
        <button onClick={() => navigate(-1)} className="back-button" aria-label="뒤로가기">
          <img src={Back} alt="뒤로가기" />
        </button>
      </header>

      <main className="party-info-main">
        {party.place_photo && <img src={party.place_photo || DefaultPartyImage} alt={title} className="party-main-image" />}
        <h1 className="party-name">{title}</h1>
          <div className="party-info-card">
            {/* 날짜 한 줄 (SVG 아이콘 + 텍스트) */}
            <div className="party-info-row meta-date">
              <img className="meta-icon" src={DateIcon} alt="" />
              <span className="info-value">
                {new Intl.DateTimeFormat('ko-KR', {
                  month: '2-digit',day: '2-digit',hour: '2-digit',minute: '2-digit', hour12: false,          
                }).format(new Date(start_time))}
              </span>
            </div>
            {/*  CSS로 숨겨둠  (추후 확인 후 지워도 된다면 지우기) */}
            <div className="party-info-row">
              <span className="info-label">장소</span>
              <span className="info-value">{place?.name}</span>
            </div>
            <div className="party-info-row">
              <span className="info-label">참여인원</span>
              <span className="info-value">{participant_count ?? 0} / {max_participants}</span>
            </div>
          </div>

        <section className="party-tags">
          <div className="tags-container">
            {(tags || []).map((tag, index) => <span key={`${tag.id}-${index}`} className="tag">#{tag.name}</span>)}
          </div>
        </section>

        <section className="party-map">
          <div className="map-placeholder" aria-label="지도 자리(준비중)" />
        </section>

        <section className="party-description">
          <p>{description}</p>
        </section>

        <section className="party-attendees" aria-labelledby="attendees-title">
          <div className="attendees-grid">
            {(participations || []).map(p => (
              <div key={p.user.id} className="attendee">
                <img src={p.user.profile_image || UserIcon} alt={p.user.username} className="attendee-img" />
                <span className="attendee-name">{p.user.username}</span>
              </div>
            ))}
          </div>
        </section>

       <section className="party-cta" aria-label="참가 신청">
        <div className="partyinfo-attendees-summary">
          <div className="partyinfo-left">
            <img className="count-icon" src={CheckIcon} alt="" />
            <span className="partyinfo-personText">
              {participant_count ?? 0}/{max_participants}
            </span>
          </div>

          <div className="profile-icons">
            {(participations || []).slice(0, 5).map((p, i) => (
              <img
                key={p.user?.id ?? i}
                src={p.user?.profile_image || UserIcon}
                alt={p.user?.username || '참석자'}
                className="profile-icon"
                style={{ zIndex: 10 - i }}
              />
            ))}
          </div>
        </div>

        <button className="join-button">참가신청</button>
      </section>
      </main>
    </div>
  );
}
