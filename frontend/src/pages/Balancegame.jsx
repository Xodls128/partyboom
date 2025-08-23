import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Back from '../assets/left_black.svg';
import Vs from '../assets/vs.svg';
import './balancegame.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function Balancegame() {
  const navigate = useNavigate();
  const { roundId } = useParams();
  const token = localStorage.getItem("access");
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 라운드 데이터 불러오기
  const fetchRound = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/v1/game/rounds/${roundId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const qs = res.data.questions.map(q => ({
        ...q,
        has_voted: q.user_has_voted || false, // serializer에서 내려주면 좋음
      }));
      setQuestions(qs);
    } catch (err) {
      console.error("라운드 조회 실패:", err);
    }
  };

  // WebSocket 연결
  useEffect(() => {
    fetchRound();

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${wsProtocol}://${window.location.host}/ws/game/round/${roundId}/`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "vote_update": {
          const d = msg.data;
          setQuestions(prev =>
            prev.map(q =>
              q.id === d.question_id
                ? {
                    ...q,
                    vote_a_count: d.vote_a_count,
                    vote_b_count: d.vote_b_count,
                  }
                : q
            )
          );
          break;
        }
        case "error":
          alert(msg.message);
          break;
        default:
          console.log("알 수 없는 이벤트:", msg);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed, fallback polling ON");
      intervalRef.current = setInterval(fetchRound, 10000);
    };

    return () => {
      ws.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [roundId]);

  // 투표
  const handleVote = (questionId, choice) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "vote", question_id: questionId, choice })
      );
      // 즉시 버튼 비활성화를 반영
      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId ? { ...q, has_voted: true } : q
        )
      );
    }
  };

  if (questions.length === 0) return <div>로딩 중...</div>;

  const currentQ = questions[currentIndex];
  const total = currentQ.vote_a_count + currentQ.vote_b_count;
  const redPercent = total ? Math.round((currentQ.vote_a_count / total) * 100) : 0;
  const yellowPercent = total ? Math.round((currentQ.vote_b_count / total) * 100) : 0;

  return (
    <>
      <div className="balancegame-header">
        <button
          onClick={() => navigate('/')}
          className="balancegame-back-button"
          aria-label="뒤로가기"
        >
          <img src={Back} alt="뒤로가기 아이콘" className="balancegame-back-icon" />
        </button>
      </div>

      <div className='balancegame-title'>
        {currentIndex + 1} / {questions.length} : 둘 중 하나만 선택해야 한다면?!
      </div>

      {/* 선택지 A */}
      <div className="balancegame-block-red">
        <button
          className="balancegame-btn-red"
          onClick={() => handleVote(currentQ.id, "A")}
          disabled={currentQ.has_voted}
        >
          <span className="balancegame-red-text">{currentQ.a_text}</span>
        </button>
      </div>

      <div className="balancegame-vs-wrap">
        <img src={Vs} alt="VS" className="balancegame-vs-img" />
      </div>

      {/* 선택지 B */}
      <div className="balancegame-block-yellow">
        <button
          className="balancegame-btn-yellow"
          onClick={() => handleVote(currentQ.id, "B")}
          disabled={currentQ.has_voted}
        >
          <span className="balancegame-yellow-text">{currentQ.b_text}</span>
        </button>
      </div>

      {/* 집계 현황 */}
      <div className='balancegame-status'>밸런스 현황</div>
      <div className="balancegame-gauge-wrap">
        <div className="balancegame-gauge-bar">
          <div className="balancegame-gauge-red" style={{ width: `${redPercent}%` }}>
            {redPercent > 10 && (
              <span className="balancegame-gauge-text">
                {currentQ.vote_a_count}명 ({redPercent}%)
              </span>
            )}
          </div>
          <div className="balancegame-gauge-yellow" style={{ width: `${yellowPercent}%` }}>
            {yellowPercent > 10 && (
              <span className="balancegame-gauge-text">
                {currentQ.vote_b_count}명 ({yellowPercent}%)
              </span>
            )}
          </div>
        </div>
        <div className="balancegame-gauge-total">{total}명 참여</div>
      </div>

      {/* 슬라이드 네비게이션 */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)}>이전</button>
        <span style={{ margin: "0 12px" }}>{currentIndex + 1} / {questions.length}</span>
        <button disabled={currentIndex === questions.length - 1} onClick={() => setCurrentIndex(currentIndex + 1)}>다음</button>
      </div>
    </>
  );
}
