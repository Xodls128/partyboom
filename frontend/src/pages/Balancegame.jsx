import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from "@/api/axios";
import Back from '../assets/left_black.svg';
import Vs from '../assets/vs.svg';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import './balancegame.css';

export default function Balancegame() {
  const navigate = useNavigate();
  const { roundId } = useParams();
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchRound = async () => {
    try {
      // api 인스턴스 사용 → Authorization 자동 처리
      const { data } = await api.get(`/api/v1/game/rounds/${roundId}/`);
      setQuestions(data.questions || []);
    } catch (err) {
      console.error("라운드 조회 실패:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchRound();

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${wsProtocol}://${window.location.host}/ws/game/round/${roundId}/`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "vote_update") {
        const d = msg.data;
        setQuestions(prev =>
          prev.map(q =>
            q.id === d.question_id
              ? { ...q, vote_a_count: d.vote_a_count, vote_b_count: d.vote_b_count }
              : q
          )
        );
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

  const handleVote = (questionId, choice) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "vote", question_id: questionId, choice }));
      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId ? { ...q, has_voted: true } : q
        )
      );
    }
  };

  if (questions.length === 0) return <div>로딩 중...</div>;

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

      <Swiper
        spaceBetween={30}
        slidesPerView={1}
        speed={600} // 슬라이드 전환 부드럽게
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
      >
        {questions.map((q, idx) => {
          const total = q.vote_a_count + q.vote_b_count;
          const redPercent = total ? Math.round((q.vote_a_count / total) * 100) : 0;
          const yellowPercent = total ? Math.round((q.vote_b_count / total) * 100) : 0;

          return (
            <SwiperSlide key={q.id}>
              <div className='balancegame-title'>
                {idx + 1} / {questions.length} : 둘 중 하나만 선택해야 한다면?!
              </div>

              {/* 선택지 A */}
              <div className="balancegame-block-red">
                <button
                  className="balancegame-btn-red"
                  onClick={() => handleVote(q.id, "A")}
                  disabled={q.has_voted}
                >
                  <span className="balancegame-red-text">{q.a_text}</span>
                </button>
              </div>

              <div className="balancegame-vs-wrap">
                <img src={Vs} alt="VS" className="balancegame-vs-img" />
              </div>

              {/* 선택지 B */}
              <div className="balancegame-block-yellow">
                <button
                  className="balancegame-btn-yellow"
                  onClick={() => handleVote(q.id, "B")}
                  disabled={q.has_voted}
                >
                  <span className="balancegame-yellow-text">{q.b_text}</span>
                </button>
              </div>

              {/* 집계 현황 */}
              <div className='balancegame-status'>밸런스 현황</div>
              <div className="balancegame-gauge-wrap">
                <div className="balancegame-gauge-bar">
                  <div className="balancegame-gauge-red" style={{ width: `${redPercent}%` }}>
                    {redPercent > 10 && (
                      <span className="balancegame-gauge-text">
                        {q.vote_a_count}명 ({redPercent}%)
                      </span>
                    )}
                  </div>
                  <div className="balancegame-gauge-yellow" style={{ width: `${yellowPercent}%` }}>
                    {yellowPercent > 10 && (
                      <span className="balancegame-gauge-text">
                        {q.vote_b_count}명 ({yellowPercent}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="balancegame-gauge-total">{total}명 참여</div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* 커스텀 progress bar 인디케이터 */}
      <div className="balancegame-progress">
        <div
          className="balancegame-progress-bar"
          style={{ width: `${((activeIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>
    </>
  );
}
