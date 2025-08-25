import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

function wsBase() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL.replace(/\/$/, "");
  const loc = window.location;
  const proto = loc.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${loc.host}`;
}

export default function BalanceWait() {
  const { partyId } = useParams();
  const navigate = useNavigate();

  const [standbyCount, setStandbyCount] = useState(0);
  const [participationCount, setParticipationCount] = useState(0);
  const [isStandby, setIsStandby] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [toggling, setToggling] = useState(false);

  const wsRef = useRef(null);
  const retryRef = useRef({ attempts: 0, timer: null, closedByUser: false });

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
      const url = `${wsBase()}/ws/party/${partyId}/`;
      const sock = new WebSocket(url);
      wsRef.current = sock;

      sock.onopen = () => {
        setWsStatus("connected");
        retryRef.current.attempts = 0;
      };

      sock.onmessage = (e) => {
        try {
          const { type, data } = JSON.parse(e.data);
          if (type === "send_standby_update") {
            setStandbyCount(data.standby_count ?? 0);
            setParticipationCount(data.participation_count ?? 0);
          } else if (type === "send_game_created") {
            navigate(`/balancegame/${data.round_id}`);
          }
        } catch {
          // ignore parse errors
        }
      };

      sock.onerror = () => {
        setErrorMsg("대기실 연결 오류. 재연결 시도 중…");
      };

      sock.onclose = () => {
        setWsStatus("disconnected");
        scheduleReconnect();
      };
    } catch {
      setErrorMsg("웹소켓 연결 실패.");
      scheduleReconnect();
    }
  }, [partyId, navigate, scheduleReconnect]);

  useEffect(() => {
    retryRef.current.closedByUser = false;
    connect();
    return () => {
      retryRef.current.closedByUser = true;
      clearRetryTimer();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000);
      }
    };
  }, [connect]);

  const toggleStandby = async () => {
    if (toggling) return;
    setErrorMsg("");
    setToggling(true);
    try {
      const res = await api.post(`/api/partyassist/standby/${partyId}/toggle/`);
      setStandbyCount(res.data.standby_count ?? 0);
      setParticipationCount(res.data.participation_count ?? 0);
      setIsStandby(res.data.is_standby);
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) setErrorMsg("이 파티의 참가자만 대기할 수 있습니다.");
      else if (status === 404) setErrorMsg("파티를 찾을 수 없습니다.");
      else setErrorMsg("대기 상태 변경 실패. 다시 시도해주세요.");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div>
      <h2>파티 대기실</h2>
      <p>WS 상태: {wsStatus}</p>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      <p>참여자 수: {participationCount}</p>
      <p>Standby 수: {standbyCount}</p>
      <button onClick={toggleStandby} disabled={toggling}>
        {toggling ? "처리 중…" : isStandby ? "대기 취소" : "대기 참여"}
      </button>
    </div>
  );
}
