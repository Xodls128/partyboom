import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Back from "../assets/left_white.svg";
import UserIcon from '../assets/profilesmall.svg';
import DefaultPartyImage from '../assets/party.jpg';
import DateIcon from '../assets/date.svg';
import CheckIcon from '../assets/check.svg';
import "./partyinfo.css";

import LoginRequest from "../components/LoginRequest";

const API_BASE = import.meta.env.VITE_API_URL;

// 안전한 에러 메시지 추출 헬퍼
async function safeGetErrorText(res) {
  try {
    const data = await res.clone().json();
    return data.detail || Object.values(data).join('\n');
  } catch {
    return await res.text();
  }
}

export default function Partyinfo() {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 로그인 요청 모달 상태
  const [showLoginRequest, setShowLoginRequest] = useState(false);

  // 로딩 상태 (참가 버튼 전용)
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fetchPartyDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/detailview/parties/${partyId}/`);
        if (!response.ok) throw new Error('파티 정보를 불러오는데 실패했습니다.');
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

  const handleJoin = async () => {
    if (isJoining) return; // 중복 실행 방지

    const token = localStorage.getItem("access");
    if (!token) {
      setShowLoginRequest(true);
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`${API_BASE}/api/reserve/join/${partyId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      });

      if (!res.ok) {
        const errorMsg = await safeGetErrorText(res);
        throw new Error(errorMsg || "참가 신청 실패");
      }

      const data = await res.json();
      navigate("/payment", { state: { participationId: data.id } });

    } catch (err) {
      console.error(err);
      alert(err.message || "참가 신청 중 오류가 발생했습니다.");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) return <div className="party-info-container">로딩 중...</div>;
  if (error) return <div className="party-info-container">에러: {error}</div>;
  if (!party) return null;

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
        {party.place_photo && (
          <img src={party.place_photo || DefaultPartyImage} alt={title} className="party-main-image" />
        )}
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
            <span className="info-value">{place?.name}</span>
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

          <button 
            className="join-button" 
            onClick={handleJoin} 
            disabled={isJoining} // 로딩 중 비활성화
          >
            {isJoining ? "신청 중..." : "참가신청"}
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
