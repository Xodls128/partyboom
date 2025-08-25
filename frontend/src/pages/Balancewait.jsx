import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function BalanceWait() {
  const { partyId } = useParams();
  const navigate = useNavigate();

  const [standbyCount, setStandbyCount] = useState(0);
  const [participationCount, setParticipationCount] = useState(0);
  const [isStandby, setIsStandby] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toggling, setToggling] = useState(false);

  // 롱폴링 관리를 위한 상태와 Ref
  const [version, setVersion] = useState(0);
  const isMounted = useRef(true);

  // 컴포넌트 언마운트 시 폴링 중단
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 서버에서 받은 데이터로 프론트엔드 상태를 업데이트하는 공통 함수
  const handleStateUpdate = useCallback((data) => {
    setVersion(data.version);
    setStandbyCount(data.standby_count);
    setParticipationCount(data.participation_count);

    // active_round_id가 있으면 게임 화면으로 이동
    if (data.active_round_id) {
      navigate(`/balancegame/${data.active_round_id}`);
    }
  }, [navigate]);

  // 대기실 상태를 롱폴링으로 확인하는 함수
  const pollForWaitState = useCallback(async (currentVersion) => {
    if (!isMounted.current) return;

    try {
      const response = await api.get(`/api/v1/standby/${partyId}/poll/?version=${currentVersion}`);
      if (!isMounted.current) return;

      if (response.status === 200) {
        // 200 OK: 새 데이터 수신
        handleStateUpdate(response.data);
        // 새 버전으로 즉시 다음 폴링 시작
        pollForWaitState(response.data.version);
      } else if (response.status === 204) {
        // 204 No Content: 타임아웃
        // 이전 버전으로 즉시 다음 폴링 시작
        pollForWaitState(currentVersion);
      }
    } catch (err) {
      setErrorMsg("대기실 상태 동기화 실패. 5초 후 재시도합니다.");
      // 에러 발생 시 5초 후 재시도
      setTimeout(() => pollForWaitState(currentVersion), 5000);
    }
  }, [partyId, handleStateUpdate]);

  // 컴포넌트 마운트 시 최초 롱폴링 시작
  useEffect(() => {
    pollForWaitState(0);
  }, [pollForWaitState]);


  const toggleStandby = async () => {
    if (toggling) return;
    setErrorMsg("");
    setToggling(true);
    try {
      // 백엔드 API 이름에 맞춰 수정: /api/partyassist/ -> /api/v1/
      const res = await api.post(`/api/v1/standby/${partyId}/toggle/`);
      // POST 요청의 응답으로 바로 UI를 업데이트하여 반응성을 높임
      handleStateUpdate(res.data);
      // 버튼 텍스트를 바꾸기 위해 is_standby 상태도 갱신
      setIsStandby(prev => !prev);
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
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      <p>참여자 수: {participationCount}</p>
      <p>Standby 수: {standbyCount}</p>
      <button onClick={toggleStandby} disabled={toggling}>
        {toggling ? "처리 중…" : isStandby ? "대기 취소" : "게임 시작 대기"}
      </button>
    </div>
  );
}
