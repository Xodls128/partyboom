import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext"; // AuthContext 사용
import api from "../api/axios"; 
import Header from '../components/Header';
import NavBar from '../components/NavBar';
import Party from '../assets/party.jpg';
import DateIcon from '../assets/date.svg';
import Check from '../assets/check.svg';
import Apply from '../assets/apply.svg';
import Location from '../assets/location.svg';
import LoginRequest from "../components/LoginRequest";
import './home.css';

export default function Home() {
  const { user, isLoggedIn } = useAuth(); // AuthContext에서 사용자 정보와 로그인 상태 가져오기
  const [partyList, setPartyList] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const navigate = useNavigate();
  const location = useLocation();

  // 사용자 정보를 가져오는 useEffect는 이제 필요 없으므로 삭제합니다.
  // AuthContext가 이 역할을 대신합니다.

  // 파티 목록 가져오기
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const { data } = await api.get("/api/homemap/home/");
        const formatted = data.map(p => ({
          id: p.id,
          image: p.place_photo || Party,
          name: "#" + p.title,
          date: new Date(p.start_time).toLocaleString("ko-KR", { 
            month: "2-digit", 
            day: "2-digit", 
            hour: "2-digit", 
            minute: "2-digit" 
          }),
          person: `${p.applied_count}/${p.max_participants}`,
          location: p.place_name,
          tags: p.tags ?? [],
        }));
        setPartyList(formatted);
      } catch (error) {
        console.error("파티 데이터를 불러오는 중 오류 발생:", error.response?.data || error.message);
      }
    };
    fetchParties();
  }, []);

  // 참가 신청
  const handleApply = async (partyId) => {
    if (isLoading) return;

    // localStorage를 직접 확인하는 대신, AuthContext의 로그인 상태를 사용
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post(`/api/reserve/join/${partyId}/`);
      navigate("/payment", { state: { participationId: data.id } });
    } catch (err) {
      console.error("참가 신청 실패:", err.response?.data || err.message);
      alert(err.response?.data?.detail || "참가 신청에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      {/* Optional Chaining(user?.name)으로 안전하게 사용자 이름에 접근 */}
      <div className='title'>{user?.name || '게스트'}님께 추천하는 파티🥳</div>

      {partyList.map((party) => (
        <div className="party-block" key={party.id}>
          <Link to={`/partyinfo/${party.id}`} aria-label="파티 정보">
            <div className="party-img-wrap">
              <img src={party.image} alt="" className="party-img" draggable="false" />
              <div className="location-badge">
                <img src={Location} alt="위치 아이콘" />
                <span>{party.location}</span>
              </div>
            </div>
          </Link>

          <div className='partyName'>{party.name}</div>
          <div className='date'>
            <img src={DateIcon} alt="" />
            <span className="dateText">{party.date}</span>
          </div>
          <div className='person'>
            <img src={Check} alt="" />
            <span className="dateText">{party.person}</span>
          </div>

          <button
            className="apply-btn"
            onClick={() => handleApply(party.id)}
            disabled={isLoading}
            aria-label="참가하기"
          >
            {isLoading ? (
              <span className="loading-text">신청 중...</span>
            ) : (
              <img src={Apply} alt="버튼" />
            )}
          </button>
        </div>
      ))}

      <LoginRequest 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        redirectTo={location.pathname} 
      />

      <div className='spaceExpansion'></div>
      <NavBar />
    </>
  );
}