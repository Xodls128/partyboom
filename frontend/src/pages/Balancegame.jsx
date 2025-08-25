import { useState, useEffect } from "react";
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
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data } = await api.get(`/api/v1/game/rounds/${roundId}/`);
        setQuestions(data.questions || []);
        setVersion(data.state?.version || 0);
      } catch (err) {
        const status = err.response?.status;
        if (status === 404) setErrorMsg("라운드를 찾을 수 없거나 종료되었습니다.");
        else if (status === 403) setErrorMsg("이 파티의 참가자만 게임에 접근할 수 있습니다.");
        else setErrorMsg("게임 데이터를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [roundId]);

  useEffect(() => {
    if (loading) return;
    let isMounted = true;

    const poll = async (currentVersion) => {
      if (!isMounted) return;
      try {
        const { data, status } = await api.get(`/api/v1/game/rounds/${roundId}/state/?version=${currentVersion}`);
        if (isMounted && status === 200) {
          setQuestions(data.data.questions || []);
          setVersion(data.version);
          setTimeout(() => poll(data.version), 1000);
        } else {
          setTimeout(() => poll(currentVersion), 1000);
        }
      } catch (error) {
        console.error("Polling error:", error);
        await new Promise(resolve => setTimeout(resolve, 5000));
        if(isMounted) poll(currentVersion);
      }
    };

    // 초기 버전(version)으로 첫 폴링 시작
    poll(version);

    return () => {
      isMounted = false;
    };
    // 여기도 version 의존성을 제거합니다.
  }, [roundId, loading]); // loading이 false가 되면 최초 1회만 실행

  const handleVote = async (questionId, choice) => {
    if (votingMap.get(questionId)) return;
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

  if (loading) return <div className="balancegame-loader"></div>;
  if (errorMsg) return <div className="balancegame-error-message">{errorMsg}</div>;

  return (
    <div className="balancegame-container">
      <div className="balancegame-header">
        <button
          onClick={() => navigate(-1)} // 이전 페이지로
          className="balancegame-back-button"
          aria-label="뒤로가기"
        >
          <img src={Back} alt="뒤로가기 아이콘" className="balancegame-back-icon" />
        </button>
      </div>

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
    </div>
  );
}
