import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./balancegame.css"; // 스타일 import

export default function BalanceWait() {
  const { partyId } = useParams();
  const navigate = useNavigate();

  const [standbyCount, setStandbyCount] = useState(0);
  const [participationCount, setParticipationCount] = useState(0);
  const [isStandby, setIsStandby] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toggling, setToggling] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      if (!isMounted) return;
      try {
        const { data, status } = await api.get(`/api/v1/partyassist/wait-state/${partyId}/?version=${version}`);
        if (isMounted && status === 200) {
          setStandbyCount(data.standby_count ?? 0);
          setParticipationCount(data.participation_count ?? 0);
          setVersion(data.version);
          if (data.active_round_id) {
            navigate(`/balancegame/${data.active_round_id}`);
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      if(isMounted) {
        setTimeout(poll, 1000);
      }
    };

    // 초기 데이터 로드
    const fetchInitialData = async () => {
        try {
            const { data } = await api.post(`/api/v1/partyassist/standby/${partyId}/toggle/`); // 초기 상태 받아오기
            setStandbyCount(data.standby_count ?? 0);
            setParticipationCount(data.participation_count ?? 0);
            setIsStandby(data.is_standby);
        } catch (err) {
            setErrorMsg("파티 정보를 가져올 수 없습니다.");
        }
    };

    fetchInitialData();
    poll();

    return () => {
      isMounted = false;
    };
  }, [partyId, version, navigate]);

  const toggleStandby = async () => {
    if (toggling) return;
    setErrorMsg("");
    setToggling(true);
    try {
      const res = await api.post(`/api/v1/partyassist/standby/${partyId}/toggle/`);
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
    <div className="balancewait-container">
      <h2 className="balancewait-title">파티 대기실</h2>
      
      <p className="balancewait-status">
        <span>{participationCount}</span>명의 파티원 중
      </p>
      <p className="balancewait-status">
        <span>{standbyCount}</span>명이 게임 시작 대기 중!
      </p>

      {errorMsg && <p className="balancewait-error">{errorMsg}</p>}

      <button 
        onClick={toggleStandby} 
        disabled={toggling} 
        className={`balancewait-button ${isStandby ? 'standby' : ''}`}>
        {toggling ? (
          <><span className="balancewait-loader"></span> 처리 중…</>
        ) : isStandby ? (
          "대기 취소"
        ) : (
          "게임 시작!"
        )}
      </button>
    </div>
  );
}
