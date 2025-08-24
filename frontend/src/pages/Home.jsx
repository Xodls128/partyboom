import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/api/axios"; 
import Header from '../components/Header';
import NavBar from '../components/NavBar';
import Party from '../assets/party.jpg';
import DateIcon from '../assets/date.svg';
import Check from '../assets/check.svg';
import Apply from '../assets/apply.svg';
import Location from '../assets/location.svg';
import PopupImg from '../assets/bell.svg';
import './home.css';


export default function Home() {
  const [partyList, setPartyList] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [username, setUsername] = useState("게스트"); // 기본값 게스트
  
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
          date: new Date(p.start_time).toLocaleString("ko-KR", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          person: `${p.applied_count}/${p.max_participants}`,
          location: p.place_name,
        }));
        setPartyList(formatted);
      } catch (error) {
        console.error("파티 데이터를 불러오는 중 오류 발생:", error.response?.data || error.message);
      }
    };

    fetchParties();
  }, []);

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
            onClick={() => setShowPopup(true)}
            aria-label="팝업 띄우기"
          >
            <img src={Apply} alt="버튼" />
          </button>
          
          {showPopup && (
            <div className="popup-overlay" onClick={() => setShowPopup(false)}>
              <img src={PopupImg} alt="팝업" className="popup-img" />
            </div>
          )}
        </div>
      ))}
      <div className='spaceExpansion'></div>
      <NavBar />
    </>
  );
}
