import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import Back from "../assets/left_black.svg";
import Vs from "../assets/vs.svg";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "./balancegame.css";

export default function Balancegame() {
  const navigate = useNavigate();
  const { roundId } = useParams();
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [votingMap, setVotingMap] = useState(new Map()); // 각 질문별 투표 중 상태
  const [errorMsg, setErrorMsg] = useState("");

  // 라운드 데이터 불러오기
  const fetchRound = async () => {
    try {
      const { data } = await api.get(`/api/v1/game/rounds/${roundId}/`);
      // 서버에서 내려주는 질문들 + 이미 투표했는지 여부는 서버에서 못주니까 UI는 로컬 관리
      setQuestions(data.questions || []);
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) setErrorMsg("라운드를 찾을 수 없거나 종료되었습니다.");
      else if (status === 403) setErrorMsg("이 파티의 참가자만 게임에 접근할 수 있습니다.");
      else setErrorMsg("게임 데이터를 불러올 수 없습니다.");
    }
  };

  useEffect(() => {
    fetchRound();

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${wsProtocol}://${window.location.host}/ws/game/round/${roundId}/`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "vote_update") {
          const d = msg.data;
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === d.question_id
                ? { ...q, vote_a_count: d.vote_a_count, vote_b_count: d.vote_b_count }
                : q
            )
          );
        }
      } catch (e) {
        console.error("WS parse error", e);
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

  // 투표하기 (HTTP POST)
  const handleVote = async (questionId, choice) => {
    if (votingMap.get(questionId)) return; // 이미 투표 중
    setVotingMap((m) => new Map(m).set(questionId, true));

    try {
      await api.post(`/api/v1/game/questions/${questionId}/vote/`, { choice });
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, has_voted: true } : q
        )
      );
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) setErrorMsg("파티 참가자만 투표할 수 있습니다.");
      else if (status === 400)
        setErrorMsg(err.response?.data?.detail || "이미 투표했거나 잘못된 요청입니다.");
      else setErrorMsg("투표 중 오류가 발생했습니다.");
    } finally {
      setVotingMap((m) => new Map(m).set(questionId, false));
    }
  };

  if (questions.length === 0) return <div>로딩 중...</div>;

  return (
    <>
      <div className="balancegame-header">
        <button
          onClick={() => navigate("/")}
          className="balancegame-back-button"
          aria-label="뒤로가기"
        >
          <img src={Back} alt="뒤로가기 아이콘" className="balancegame-back-icon" />
        </button>
      </div>

      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

      <Swiper
        spaceBetween={30}
        slidesPerView={1}
        speed={600}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
      >
        {questions.map((q, idx) => {
          const total = q.vote_a_count + q.vote_b_count;
          const redPercent = total ? Math.round((q.vote_a_count / total) * 100) : 0;
          const yellowPercent = total ? Math.round((q.vote_b_count / total) * 100) : 0;
          const voting = votingMap.get(q.id);

          return (
            <SwiperSlide key={q.id}>
              <div className="balancegame-title">
                {idx + 1} / {questions.length} : 둘 중 하나만 선택해야 한다면?!
              </div>

              {/* 선택지 A */}
              <div className="balancegame-block-red">
                <button
                  className="balancegame-btn-red"
                  onClick={() => handleVote(q.id, "A")}
                  disabled={q.has_voted || voting}
                >
                  <span className="balancegame-red-text">
                    {voting ? "처리 중…" : q.a_text}
                  </span>
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
                  disabled={q.has_voted || voting}
                >
                  <span className="balancegame-yellow-text">
                    {voting ? "처리 중…" : q.b_text}
                  </span>
                </button>
              </div>

              {/* 집계 현황 */}
              <div className="balancegame-status">밸런스 현황</div>
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

      {/* Progress Bar */}
      <div className="balancegame-progress">
        <div
          className="balancegame-progress-bar"
          style={{ width: `${((activeIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>
    </>
  );
}