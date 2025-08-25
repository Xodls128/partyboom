import { useState, useEffect, useRef, useCallback } from "react";
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
  
  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [votingMap, setVotingMap] = useState(new Map());
  const [errorMsg, setErrorMsg] = useState("");
  
  // 롱폴링 관리를 위한 상태와 Ref
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const isMounted = useRef(true);

  // 컴포넌트 언마운트 시 폴링 중단하기 위한 설정
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 롱폴링으로 데이터 업데이트를 확인하는 함수
  const pollForUpdates = useCallback(async (timestamp) => {
    if (!isMounted.current) return; // 컴포넌트가 언마운트되면 중단

    try {
      // 타임스탬프가 있으면 쿼리 파라미터로 추가
      const url = `/api/v1/game/rounds/${roundId}/poll/${timestamp ? `?last_seen_timestamp=${timestamp}` : ''}`;
      const response = await api.get(url);

      if (!isMounted.current) return;

      if (response.status === 200) {
        // 200 OK: 새 데이터 수신
        const { questions: newQuestions, last_updated_at: newTimestamp } = response.data;
        setQuestions(newQuestions || []);
        setLastUpdatedAt(newTimestamp);
        // 새 타임스탬프로 즉시 다음 폴링 시작
        pollForUpdates(newTimestamp);
      } else if (response.status === 204) {
        // 204 No Content: 타임아웃, 변경 없음
        // 이전 타임스탬프로 즉시 다음 폴링 시작
        pollForUpdates(timestamp);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) setErrorMsg("라운드를 찾을 수 없거나 종료되었습니다.");
      else if (status === 403) setErrorMsg("이 파티의 참가자만 게임에 접근할 수 있습니다.");
      else {
        setErrorMsg("데이터 동기화 오류. 5초 후 재시도합니다.");
        // 에러 발생 시 5초 후 재시도
        setTimeout(() => pollForUpdates(timestamp), 5000);
      }
    }
  }, [roundId]);

  // 컴포넌트 마운트 시 최초 롱폴링 시작
  useEffect(() => {
    pollForUpdates(null);
  }, [pollForUpdates]);

  // 투표하기 (HTTP POST) - 이 함수는 변경 없음
  const handleVote = async (questionId, choice) => {
    if (votingMap.get(questionId)) return;
    setVotingMap((m) => new Map(m).set(questionId, true));

    try {
      await api.post(`/api/v1/game/questions/${questionId}/vote/`, { choice });
      // UI 즉시 반응성을 위해 로컬 상태 우선 변경
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, has_voted: true } : q
        )
      );
      // 서버의 last_updated_at이 변경되었으므로 다음 롱폴링에서 최신 투표 결과가 반영됨
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
    // JSX 렌더링 부분은 변경사항 없음
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
      <div className="balancegame-progress">
        <div
          className="balancegame-progress-bar"
          style={{ width: `${((activeIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>
    </>
  );
}
