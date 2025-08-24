import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/api/axios"; 
import Header from '../components/Header';
import NavBar from '../components/NavBar';
import Party from '../assets/party.jpg';
import DateIcon from '../assets/date.svg';
import Check from '../assets/check.svg';
import Apply from '../assets/apply.svg';
import Location from '../assets/location.svg';
import LoginRequest from "../components/LoginRequest";
import './home.css';


async function safeGetErrorText(res) {
  try {
    const data = await res.clone().json();
    return data.detail || Object.values(data).join('\n');
  } catch {
    return await res.text();
  }
}

export default function Home() {
  const [partyList, setPartyList] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState("게스트");
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/api/mypage/");
        setUsername(data.name || "게스트");

      } catch (error) {
        console.error("유저 정보를 불러오는 중 오류:", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const { data } = await api.get("/api/homemap/home/");
        const formatted = data.map(p => ({
          id: p.id,
          image: p.place_photo || Party,
          name: "#" + p.title,
          date: new Date(p.start_time).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
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

  // ---로딩 상태 처리가 추가된 handleApply 함수---
  const handleApply = async (partyId) => {
    if (isLoading) return; // 이미 로딩 중이면 중복 실행 방지

    const token = localStorage.getItem("access");
    if (!token) {
      setShowLoginModal(true);
      return;
    }

    setIsLoading(true); // 로딩 시작
    try {
      const res = await fetch(`${API_BASE}/api/reserve/join/${partyId}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorMsg = await safeGetErrorText(res);
        throw new Error(errorMsg || "참가 신청에 실패했습니다.");
      }

      const data = await res.json();
      navigate("/payment", { state: { participationId: data.id } });

    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsLoading(false); // 로딩 종료 (성공/실패 무관)
    }
  };
  

  return (
    <>
      <Header />
      <div className='title'>{username}님께 추천하는 파티🥳</div>

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
          <div className="party-tags-list">
            {party.tags.map(tag => (
              <span key={tag.id} className="party-tag-item">#{tag.name}</span>
            ))}
          </div>
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
            disabled={isLoading} // 로딩 중일 때 비활성화
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
