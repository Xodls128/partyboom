import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Assistbomb from '../assets/assistbomb.svg';
import Location from '../assets/location.svg';
import DateIcon from '../assets/date.svg';
import Check from '../assets/check.svg';
import Profilesmall from '../assets/profilesmall.svg';
import './assist.css';
import api from '../api/axios'; // axios 인스턴스 사용

export default function Assist() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]); // 파티 데이터
  const [currentPartyIndex, setCurrentPartyIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [startingPartyId, setStartingPartyId] = useState(null);

  // 파티 데이터 불러오기
  const fetchParties = async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        setShowLoginPopup(true);
        return;
      }

      // API 엔드포인트로 요청 (API 명세서에 있는 엔드포인트)
      const response = await api.get("/api/partyassist/myparties/");
      
      // 받아온 데이터에 카운트다운 정보 추가
      const partiesWithCountdown = response.data.map(party => {
        const countdown = formatCountdown(party.start_time);
        const timeLeft = getTimeLeftInMs(party.start_time);
        
        return {
          ...party,
          countdown,
          timeLeft,
          current_participants: party.participation_count
        };
      });
      
      // 시작 시간이 가까운 순서로 정렬
      partiesWithCountdown.sort((a, b) => a.timeLeft - b.timeLeft);
      
      setParties(partiesWithCountdown);
      setLoading(false);
      
      // 시작된 파티 확인
      checkForStartedParties(partiesWithCountdown);
    } catch (error) {
      if (error.response?.status === 401) {
        setShowLoginPopup(true);
      } else {
        console.error("파티 데이터를 불러오는 중 오류 발생:", error);
        setError("파티 정보를 불러오는데 실패했습니다.");
      }
      setLoading(false);
    }
  };

  // 시작된 파티 확인
  const checkForStartedParties = (partyList) => {
    const now = new Date();
    const startedParty = partyList.find(party => {
      const startTime = new Date(party.start_time);
      return startTime <= now;
    });

    if (startedParty) {
      setStartingPartyId(startedParty.id);
      setShowStartModal(true);
      
      // 3초 후 해당 파티의 balancewait 페이지로 이동
      setTimeout(() => {
        navigate(`/balancewait/${startedParty.id}`);
      }, 3000);
    }
  };

  // 시간 계산을 위한 함수 (밀리초 단위로 남은 시간 계산)
  const getTimeLeftInMs = (startTimeString) => {
    const now = new Date();
    const startTime = new Date(startTimeString);
    return startTime - now;
  };

  // 카운트다운 포맷 함수
  const formatCountdown = (startTimeString) => {
    const timeDiff = getTimeLeftInMs(startTimeString);
    
    if (timeDiff <= 0) return "곧 시작합니다";
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    return `${days}일 ${hours}시간 ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Standby 상태 토글
  const toggleStandby = async (partyId) => {
    try {
      const response = await api.post(`/api/partyassist/standby/${partyId}/toggle/`);
      
      // 파티 목록 업데이트
      setParties(prevParties => 
        prevParties.map(party => 
          party.id === partyId 
            ? { 
                ...party, 
                is_standby: response.data.is_standby,
                participation_count: response.data.participation_count
              } 
            : party
        )
      );
      
      return response.data;
    } catch (error) {
      console.error("Standby 상태 변경 중 오류 발생:", error);
      return null;
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchParties();
    
    // 1초마다 카운트다운 업데이트 및 파티 시작 시간 체크
    const intervalId = setInterval(() => {
      setParties(prevParties => {
        const updatedParties = prevParties.map(party => {
          const countdown = formatCountdown(party.start_time);
          const timeLeft = getTimeLeftInMs(party.start_time);
          
          // 새로 시작된 파티 체크
          if (timeLeft <= 0 && party.timeLeft > 0) {
            setStartingPartyId(party.id);
            setShowStartModal(true);
            
            // 3초 후 해당 파티의 balancewait 페이지로 이동
            setTimeout(() => {
              navigate(`/balancewait/${party.id}`);
            }, 3000);
          }
          
          return {
            ...party,
            countdown,
            timeLeft
          };
        });
        
        return updatedParties;
      });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [navigate]);

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

  // 로딩 중 표시
  if (loading) {
    return (
      <>
        <div className="assist-loading">
          <div className="loading-spinner"></div>
          <p>파티 정보를 불러오는 중...</p>
        </div>
        <NavBar />
      </>
    );
  }

  // 에러 표시
  if (error) {
    return (
      <>
        <div className="assist-error">
          <p>{error}</p>
          <button onClick={fetchParties}>다시 시도</button>
        </div>
        <NavBar />
      </>
    );
  }

  // 참여 중인 파티가 없을 때
  if (parties.length === 0 && !showLoginPopup) {
    return (
      <>
        <div className="assist-no-parties">
          <p>참여 중인 파티가 없습니다.</p>
          <button onClick={() => navigate('/')}>파티 둘러보기</button>
        </div>
        <NavBar />
      </>
    );
  }

  const currentParty = parties[currentPartyIndex] || {};

  return (
    <>
      {showLoginPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>파티 도움 요청은 로그인 후 확인하실 수 있습니다.</p>
            <div className="popup-actions">
              <button
                className="login-btn"
                onClick={() => navigate("/kakao-login")}
              >
                로그인하기
              </button>
              <button
                className="back-btn"
                onClick={() => navigate("/")}
              >
                뒤로가기
              </button>
            </div>
          </div>
        </div>
      )}

      {showStartModal && (
        <div className="start-modal-overlay">
          <div className="start-modal">
            <div className="start-modal-spinner"></div>
            <p>파티가 시작됩니다!</p>
            <p>밸런스게임 준비 페이지로 이동합니다.</p>
          </div>
        </div>
      )}

      {!showLoginPopup && parties.length > 0 && (
        <>
          <div className="assist-countdown">
            <div className="assist-countdown-text">파티 시작까지</div>
            <div className="assist-countdown-row">
              <div className="assist-countdown-time">
                {currentParty.countdown}
              </div>
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
                <img 
                  src={currentParty.place_photo || 'https://via.placeholder.com/400x200'} 
                  alt="" 
                  className="assist-party-img" 
                  draggable="false" 
                />
                <div className="assist-location-badge">
                  <img src={Location} alt="위치 아이콘" />
                  <span>{currentParty.place_name}</span>
                </div>
              </div>

              <div className='assist-partyName'>{currentParty.title}</div>
              <div className='assist-date'>
                <img src={DateIcon} alt="" />
                <span className="assist-dateText">
                  {new Date(currentParty.start_time).toLocaleString('ko-KR', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className='assist-person'>
                <img src={Check} alt="" />
                <span className="assist-dateText">
                  {currentParty.participation_count}/{currentParty.max_participants}
                </span>
              </div>
              <div className="assist-profile-icons">
                {currentParty.participants
                  ?.sort((a, b) => {
                    // 프로필 이미지가 있는 사람을 우선 정렬
                    if (a.profile_image && !b.profile_image) return -1;
                    if (!a.profile_image && b.profile_image) return 1;
                    return 0;
                  })
                  .slice(0, 5)
                  .map((participant, index) => (
                    <img 
                      key={index}
                      src={participant.profile_image || Profilesmall} 
                      alt={`프로필${index+1}`} 
                      className="assist-profile-icon" 
                      draggable="false" 
                    />
                  ))}
              </div>

              <div className="assist-standby">
                <button 
                  className={`assist-standby-button ${currentParty.is_standby ? 'active' : ''}`}
                  onClick={() => toggleStandby(currentParty.id)}
                >
                  {currentParty.is_standby ? '준비 완료!' : '준비하기'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      <NavBar />
    </>
  );
}
