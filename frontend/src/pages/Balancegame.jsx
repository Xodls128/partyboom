import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

function wsBase() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL.replace(/\/$/, "");
  const loc = window.location;
  const proto = loc.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${loc.host}`;
}

export default function BalanceGame() {
  const { roundId } = useParams();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [wsStatus, setWsStatus] = useState("disconnected");

  const wsRef = useRef(null);
  const retryRef = useRef({ attempts: 0, timer: null, closedByUser: false });
  const [votingMap, setVotingMap] = useState(new Map());

  const clearRetryTimer = () => {
    if (retryRef.current.timer) {
      clearTimeout(retryRef.current.timer);
      retryRef.current.timer = null;
    }
  };

  const scheduleReconnect = useCallback(() => {
    if (retryRef.current.closedByUser) return;
    const attempts = ++retryRef.current.attempts;
    const delay = Math.min(30000, 500 * Math.pow(2, attempts - 1));
    setWsStatus("reconnecting");
    clearRetryTimer();
    retryRef.current.timer = setTimeout(connect, delay);
  }, []);

  const connect = useCallback(() => {
    clearRetryTimer();
    setWsStatus("connecting");
    try {
      const url = `${wsBase()}/ws/game/round/${roundId}/`;
      const sock = new WebSocket(url);
      wsRef.current = sock;

      sock.onopen = () => {
        setWsStatus("connected");
        retryRef.current.attempts = 0;
      };

      sock.onmessage = (e) => {
        try {
          const { type, data } = JSON.parse(e.data);
          if (type === "vote_update") {
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === data.question_id
                  ? { ...q, vote_a_count: data.vote_a_count, vote_b_count: data.vote_b_count }
                  : q
              )
            );
          }
        } catch {
          // ignore parse errors
        }
      };

      sock.onerror = () => setErrorMsg("실시간 연결 오류. 자동 재연결 시도 중…");
      sock.onclose = () => {
        setWsStatus("disconnected");
        scheduleReconnect();
      };
    } catch {
      setErrorMsg("웹소켓 연결 실패");
      scheduleReconnect();
    }
  }, [roundId, scheduleReconnect]);

  useEffect(() => {
    retryRef.current.closedByUser = false;
    connect();
    return () => {
      retryRef.current.closedByUser = true;
      clearRetryTimer();
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close(1000);
    };
  }, [connect]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/v1/game/rounds/${roundId}/`);
        setQuestions(res.data.questions || []);
      } catch (err) {
        const status = err.response?.status;
        if (status === 404) setErrorMsg("라운드를 찾을 수 없거나 종료되었습니다.");
        else if (status === 403) setErrorMsg("이 파티의 참가자만 접근할 수 있습니다.");
        else setErrorMsg("게임 데이터를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [roundId]);

  const castVote = async (questionId, choice) => {
    if (votingMap.get(questionId)) return;
    setVotingMap((m) => new Map(m).set(questionId, true));
    try {
      await api.post(`/api/v1/game/questions/${questionId}/vote/`, { choice });
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) setErrorMsg("파티 참가자만 투표할 수 있습니다.");
      else if (status === 400) setErrorMsg(err.response?.data?.detail || "이미 투표했거나 잘못된 요청입니다.");
      else setErrorMsg("투표 중 오류가 발생했습니다.");
    } finally {
      setVotingMap((m) => new Map(m).set(questionId, false));
    }
  };

  return (
    <div>
      <h2>밸런스 게임</h2>
      <p>WS 상태: {wsStatus}</p>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      {loading && <p>게임 데이터를 불러오는 중…</p>}
      {!loading &&
        questions.map((q) => {
          const voting = votingMap.get(q.id);
          return (
            <div key={q.id} style={{ marginBottom: "1rem" }}>
              <p>{q.order}. {q.a_text} vs {q.b_text}</p>
              <button onClick={() => castVote(q.id, "A")} disabled={voting}>
                {voting ? "처리 중…" : `A (${q.vote_a_count})`}
              </button>
              <button onClick={() => castVote(q.id, "B")} disabled={voting}>
                {voting ? "처리 중…" : `B (${q.vote_b_count})`}
              </button>
            </div>
          );
        })}
    </div>
  );
}
