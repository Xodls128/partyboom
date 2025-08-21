import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
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
  
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/homemap/home/");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        // API 응답이 배열인지 확인하여 안정성 확보
        if (Array.isArray(data)) {
          const formatted = data.map(p => ({
            id: p.id,
            image: Party, // 항상 프론트엔드의 기본 이미지를 사용
            name: "#" + p.title,
            date: new Date(p.start_time).toLocaleString("ko-KR", {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }),
            person: `${p.participant_count ?? 0}/${p.max_participants}`,
            location: p.place?.name,
          }));
          setPartyList(formatted);
        } else {
          console.error("API로부터 받은 데이터가 배열이 아닙니다:", data);
          setPartyList([]); // 오류 발생 시 빈 배열로 초기화
        }
      } catch (error) {
        console.error("파티 데이터를 불러오는 중 오류 발생:", error);
      }
    };

    fetchParties();
  }, []);

  return (
    <>
      <Header />
      <div className='title'>OO님께 추천하는 파티🥳</div>

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
