import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import NavBar from '../components/NavBar';
import Profilesmall from '../assets/profilesmall.svg';
import './balancewait.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function Balancewait() {
  const [standbyCount, setStandbyCount] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [isStandby, setIsStandby] = useState(false);

  const navigate = useNavigate();
  const { partyId } = useParams(); // URL에 /balancewait/:partyId 형식으로 전달된다고 가정
  const token = localStorage.getItem("access");

  // standby 토글 (참여/취소)
  const handleJoin = async () => {
    try {
      const res = await axios.post(
        `${API_BASE}/api/partyassist/standby/${partyId}/toggle/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsStandby(res.data.is_standby);
      setStandbyCount(res.data.standby_count);
      setParticipantCount(res.data.participation_count);
    } catch (err) {
      console.error("참여 실패:", err);
    }
  };

  // participants 불러오기
  const fetchParticipants = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/partyassist/standby/${partyId}/participants/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setParticipants(res.data);
    } catch (err) {
      console.error("참여자 불러오기 실패:", err);
    }
  };

  // WebSocket 연결 + fallback polling
  useEffect(() => {
    fetchParticipants(); // 최초 1번 불러오기

    let interval; // polling fallback용 변수
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${wsProtocol}://${window.location.host}/ws/party/${partyId}/`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "send_standby_update") {
        setStandbyCount(data.data.standby_count);
        setParticipantCount(data.data.participation_count);
        fetchParticipants(); // 참가자 목록 갱신
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed, fallback to polling");
      interval = setInterval(fetchParticipants, 10000);
    };

    // cleanup
    return () => {
      ws.close();
      if (interval) clearInterval(interval);
    };
  }, [partyId]);

  return (
    <>
      <div className="balancewait-title">
        <div className="balancewait-partyname">#유학생과_언어교류</div>
        <div className="balancewait-partyname">파티가 진행 중이에요!</div>
      </div>

      <div style={{ position: 'relative', width: '343px', margin: '32px auto 0 auto' }}>
        <button className="balancewait-join-btn" onClick={handleJoin}>
          <span className="balancewait-join-text">
            {isStandby ? `대기중... (${standbyCount}/${participantCount})` : "밸런스게임\n참여하기"}
          </span>
        </button>

          {isStandby && (
            <div className="balancewait-join-overlay">
              <span className="balancewait-join-text">
                대기중...<br />{standbyCount}/{participantCount}
              </span>
            </div>
          )}
      </div>

      <div className="balancewait-profile-icons">
        {participants.slice(0, 5).map((p) => (
          <img
            key={p.id}
            src={p.user?.profile_image || Profilesmall}
            alt={p.user?.username || "프로필"}
            className="balancewait-profile-icon"
            draggable="false"
          />
        ))}
      </div>

      <div className="balancewait-participants-link-wrap">
        <button
          className="balancewait-participants-link"
          onClick={() => navigate(`/participants/${partyId}`)}
        >
          참여자 프로필 보기→
        </button>
      </div>

      <NavBar />
    </>
  );
}
