import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Back from "../assets/left_white.svg";
import UserIcon from '../assets/profilesmall.svg';
import DefaultPartyImage from '../assets/party.jpg';
import DateIcon from '../assets/date.svg';
import CheckIcon from '../assets/check.svg';
import "./partyinfo.css";
import LoginRequest from "../components/LoginRequest";
import Location from "../assets/location.svg";

const MAX_PROFILES = 5;
const API_BASE = import.meta.env.VITE_API_URL;

export default function Partyinfo() {
  const { partyId } = useParams();
  const navigate = useNavigate();

  const [party, setParty] = useState(null);
  const [loadingParty, setLoadingParty] = useState(true);
  const [error, setError] = useState(null);

  const [showLoginRequest, setShowLoginRequest] = useState(false);
  const [joining, setJoining] = useState(false);

  // 이미지 경로 처리
  const resolveImg = (url) => {
    if (!url) return '';
    if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    const path = String(url).replace(/^\/+/, '');
    return `${API_BASE}/${path}`;
  };

  useEffect(() => {
    const fetchPartyDetails = async () => {
      try {
        setLoadingParty(true);
        const { data } = await api.get(`/api/detailview/parties/${partyId}/`);
        setParty(data);
      } catch (err) {
        setError(err.response?.data?.detail || '파티 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoadingParty(false);
      }
    };

    fetchPartyDetails();
  }, [partyId]);

  const handleJoin = async () => {
    if (joining) return;

    const token = localStorage.getItem("access");
    if (!token) {
      setShowLoginRequest(true);
      return;
    }

    setJoining(true);
    try {
      const { data } = await api.post(`/api/reserve/join/${partyId}/`);
      navigate("/payment", { state: { participationId: data.id } });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "참가 신청 중 오류가 발생했습니다.");
    } finally {
      setJoining(false);
    }
  };

  if (loadingParty) return <div className="party-info-container">로딩 중...</div>;
  if (error) return <div className="party-info-container">에러: {error}</div>;
  if (!party) return null;

  const { 
    title, 
    start_time, 
    place_name, 
    participant_count, 
    max_participants, 
    description, 
    tags, 
    participations, 
    place_photo,
    place_map 
  } = party;

  return (
    <div className="party-info-container">
      <header className="party-info-header">
        <button onClick={() => navigate(-1)} className="back-button" aria-label="뒤로가기">
          <img src={Back} alt="뒤로가기" />
        </button>
      </header>

      <main className="party-info-main">
        <img 
          src={resolveImg(place_photo) || DefaultPartyImage} 
          alt={title} 
          className="party-main-image" 
        />

        <h1 className="party-name">{title}</h1>
        
        <div className="party-info-card">
          <div className="party-info-row meta-date">
            <img className="meta-icon" src={DateIcon} alt="" />
            <span className="info-value">
              {new Intl.DateTimeFormat('ko-KR', {
                month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
              }).format(new Date(start_time))}
            </span>
          </div>
          <div className="party-info-row">
            <span className="info-label">장소</span>
            <span className="info-value">{place_name}</span>
          </div>
          <div className="party-info-row">
            <span className="info-label">참여인원</span>
            <span className="info-value">{participant_count ?? 0} / {max_participants}</span>
          </div>
        </div>

        <section className="party-tags">
          <div className="tags-container">
            {(tags || []).map((tag, index) => (
              <span key={`${tag.id}-${index}`} className="tag">#{tag.name}</span>
            ))}
          </div>
        </section>

        <section className="party-map">
          <div className="party-map-wrap">
            {place_map ? (
              <img 
                src={resolveImg(place_map)} 
                alt={`${title} 지도`} 
                className="party-map-image" 
                draggable="false"
              />
            ) : (
              <div className="map-placeholder" aria-label="지도 준비중" />
            )}

            {/* ✅ 장소명 배지 추가 */}
            <div className="location-badge">
              <img src={Location} alt="위치 아이콘" />
              <span>{place_name}</span>
            </div>
          </div>
        </section>

        <section className="party-description">
          <p>{description}</p>
        </section>

        <section className="party-attendees">
          <div className="attendees-grid">
            {(participations || []).map((p, i) => (
              <div key={p.user?.id ?? i} className="attendee">
                <img 
                  src={resolveImg(p.user?.profile_image) || UserIcon} 
                  alt={p.user?.username || '참석자'} 
                  className="attendee-img" 
                />
                <span className="attendee-name">{p.user?.username}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="party-cta">
          <div className="partyinfo-attendees-summary">
            <div className="partyinfo-left">
              <img src={CheckIcon} alt="" className="count-icon" />
              <span className="partyinfo-personText">
                {participant_count ?? 0}/{max_participants}
              </span>
            </div>

            <div className="profile-icons">
              {(participations || []).slice(0, MAX_PROFILES).map((p, i) => (
                <img
                  key={p.user?.id ?? i}
                  src={resolveImg(p.user?.profile_image) || UserIcon}
                  alt={p.user?.username || '참석자'}
                  className="profile-icon"
                  style={{ zIndex: 10 - i }}
                />
              ))}
            </div>
          </div>

          <button 
            className="join-button" 
            onClick={handleJoin} 
            disabled={joining}
          >
            {joining ? "신청 중..." : "참가신청"}
          </button>
        </section>
      </main>

      {showLoginRequest && (
        <LoginRequest 
          isOpen={true} 
          onClose={() => setShowLoginRequest(false)} 
          redirectTo={`/partyinfo/${partyId}`} 
        />
      )}
    </div>
  );
}