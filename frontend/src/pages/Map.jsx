import { useEffect, useRef, useState } from 'react';
import './Map.css';                 
import LeafletMap from '../components/LeafletMap.jsx';
import PartySmall from './PartySmall.jsx';   
import PartySmallImages from '../assets/partysmall.jpg';
import Header from '../components/Header.jsx';
import NavBar from '../components/NavBar.jsx';
import { useNavigate } from 'react-router-dom'; // useNavigate 추가

const API_BASE = import.meta.env.VITE_API_URL;

export default function Map() {
  // useRef - 리렌더 없이 값 기억 
  const sheetRef = useRef(null);          // 시트 DOM 참조 
  const sheetScrollRef = useRef(null); // 시트 내부 스크롤 참조
  const dragMode = useRef(null);
  const lastDownFromGrabber = useRef(false);

  const THRESH_PX = 6;
  const startY = useRef(0);               // 드래그 시작  좌표
  const startPct = useRef(0);             // 드래그 시작 시트 높이(%) 
  const activePointerId = useRef(null);   // 추적하는 포인터 ID
  const stageHRef = useRef(1);            // 부모 높이(px) 캐시

  // 최상단 판정 여유(픽셀) & 접기 제스처 누적 거리(픽셀)
  const TOP_SLACK = 8;            // scrollTop이 0~8px 이하면 '최상단'으로 간주
  const COLLAPSE_DRAG_PX = 24;    // 아래로 총 24px 끌면 '접기' 의도 확정
  
  // 접기 의도 감지용 플래그 + 누적 드래그 거리
  const pulledDown = useRef(false);
  const dyAccum = useRef(0);

  // 두 상태 스냅(최소/전체)
  const MIN_PCT = 22;                     // 시트 최저 높이(%)
  const MAX_PCT = 76;                    // 시트 최고 높이(%)
  const MAX_DRAG_PCT = 90;                // 시트가 최대로 드래그될 수 있는 높이(%)
  const MID_THRESHOLD = (MIN_PCT + MAX_PCT) / 2; // 중앙 임계치(기본 65)
  const MID_BAND = 4;                     // 중앙 밴드(%): 전환 히스테리시스
  const PULL_DOWN_THRESHOLD = MAX_PCT * 0.8; // MAX_PCT의 80% 지점 (아래로 당겨 최소화하는 임계치)

  // 시트 높이 관리 (초기 최소)
  const [heightPct, setHeightPct] = useState(MIN_PCT);
  const [parties, setParties] = useState([]); //  파티 목록 데이터 상태
  const isExpanded = heightPct >= MAX_PCT;   /*  이후 네비게이션 들어오면 조정 필요  */

  const navigate = useNavigate(); // useNavigate 훅 사용

  // 백엔드에서 파티 목록 데이터 가져오기
  useEffect(() => {
    const fetchParties = async () => {
      try {
        // 백엔드 API 엔드포인트 (배포환경에 맞게 수정)
        const response = await fetch(`${API_BASE}/api/detailview/parties/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // API 데이터를 프론트엔드 컴포넌트 props에 맞게 변환
        const formattedParties = data.map(p => ({
          id: p.id,
          eventTitle: p.title,
          eventDate: p.start_time,
          placeName: p.place_name,
          attendees: p.applied_count,
          capacity: p.max_participants,
          placeImageUrl: p.place_photo || PartySmallImages, // 백엔드 이미지가 없으면 기본 이미지 사용
          place_x_norm: p.place_x_norm,   
          place_y_norm: p.place_y_norm,
        }));

        setParties(formattedParties);
      } catch (error) {
        console.error("Failed to fetch parties:", error);
        // 에러 발생 시 사용자에게 알릴 수 있는 UI 처리 (옵션)
      }
    };

    fetchParties();
  }, []); // 빈 배열을 전달하여 컴포넌트 마운트 시 1회만 실행

  // 배경 스크롤 락 (100%일 때만)
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (isExpanded) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isExpanded]);

  // 부모(.phone-stage) 높이 계산
  const getStageHeight = () => {
    const el = sheetRef.current;
    if (!el) return 1;
    const stage = el.parentElement;
    return Math.max(stage?.clientHeight ?? el.clientHeight, 1);
  };

  // 범위 고정 
  const clamp = (n, min = MIN_PCT, max = MAX_DRAG_PCT) => Math.min(Math.max(n, min), max);

  const beginDrag = (clientY) => {
    startY.current = clientY;
    startPct.current = heightPct;
    stageHRef.current = getStageHeight(); // ← 여기서 1회 측정
  };

  const moveDrag = (clientY) => {
    if (activePointerId.current == null) return;
    const dy = clientY - startY.current;
    const deltaPct = -(dy / stageHRef.current) * 100;
    const candidate = clamp(startPct.current + deltaPct);

    // 이진 스냅 미리 반영(중앙 밴드 벗어날 때만 전환)
    let target = heightPct; // 기본은 현재 상태 유지
    if (candidate >= MID_THRESHOLD + MID_BAND / 2) target = MAX_PCT;
    else if (candidate <= MID_THRESHOLD - MID_BAND / 2) target = MIN_PCT;

    setHeightPct(target);
  };

  const endDrag = () => {
    if (activePointerId.current == null) return;

    // 오버드래그 후 손을 떼면 MAX_PCT로 스냅
    if (heightPct > MAX_PCT) {
      setHeightPct(MAX_PCT);
      return;
    }

    // 시트가 MAX_PCT 근처에 있을 때 아래로 당기면 MIN_PCT로 스냅
    if (heightPct < PULL_DOWN_THRESHOLD) {
      setHeightPct(MIN_PCT);
    } else {
      setHeightPct(MAX_PCT);
    }
  };

  // 포인터 이벤트 핸들러 (마우스/터치 공통)
  const onPointer = (e) => {
    // 이벤트가 지도까지 전파되는 것을 막아 드래그 기능 충돌 방지
    e.stopPropagation();

    const scrollEl = sheetScrollRef.current; // 스크롤 가능한 요소 참조

    if (e.type === 'pointerdown') {
      activePointerId.current = e.pointerId;
      e.currentTarget?.setPointerCapture?.(e.pointerId);

      beginDrag(e.clientY);

      lastDownFromGrabber.current = !!e.target.closest?.('[data-grabber="true"]'); // ✅ [추가]
      dragMode.current = null;

      if (isExpanded && scrollEl && scrollEl.scrollTop > TOP_SLACK) {
        dragMode.current = 'scroll';
    }
    pulledDown.current = false;
  }

  if (e.type === 'pointermove') {
    if (activePointerId.current !== e.pointerId) return;
    const dy = e.clientY - startY.current;

    if (isExpanded && scrollEl) {
      if (dragMode.current === null) {
        if (Math.abs(dy) < THRESH_PX) return;
        dragMode.current = (dy < 0) 
        ? 'scroll' 
        : (scrollEl.scrollTop <= TOP_SLACK ? 'sheet' : 'scroll');
      }

      // 스크롤 모드 중 최상단 도달 + 아래로 끌면 → 시트 드래그로 핸드오프
      if (dragMode.current === 'scroll') {
        if (scrollEl.scrollTop <= TOP_SLACK && dy > 0) {
          scrollEl.scrollTop = 0;
          dragMode.current = 'sheet';
          startY.current = e.clientY;
          startPct.current = heightPct;
          return;
        }
        scrollEl.scrollTop -= dy;     // 우리가 직접 내부 스크롤 처리
        startY.current = e.clientY;   // 기준점 갱신
        return;
      }

      if (dragMode.current === 'sheet') {
          // 시트가 이미 최대 높이이고, 아래로 끄는 중이면 '접기' 의도 기록
        if (heightPct >= MAX_PCT && dy > 0) {
          pulledDown.current = true;
        }
        
        if (heightPct >= MAX_PCT && dy < 0) {
          const hasScrollable = scrollEl.scrollHeight > scrollEl.clientHeight;
          if (hasScrollable) {
            dragMode.current = 'scroll';
            startY.current = e.clientY;  // 기준점 재설정
            return;
          }
        }

        moveDrag(e.clientY);
        return;
      }
    }

    // 그 외는 항상 시트 드래그
    dragMode.current = 'sheet';
    moveDrag(e.clientY);
  }

  if (e.type === 'pointerup' || e.type === 'pointercancel') {
    if (activePointerId.current !== e.pointerId) return;

    e.currentTarget?.releasePointerCapture?.(e.pointerId);

    if (dragMode.current === 'sheet') {
      if (isExpanded && pulledDown.current) {
        setHeightPct(MIN_PCT);
      } else {
        endDrag(); // 기존 스냅
      }
    }
    pulledDown.current = false;

    // 상태 초기화
    dragMode.current = null;
    lastDownFromGrabber.current = false;
    activePointerId.current = null;
    }
  };

  // 휠로 높이 제어 : 즉시 MIN/MAX 전환 (데스크톱 전용)
  const onWheel = (e) => {
    if (isExpanded) {    
      const scrollEl = sheetScrollRef.current;
      // 최상단 근처에서 "아래"로 휠 → 바로 접기
      if (e.deltaY > 0 && scrollEl && scrollEl.scrollTop <= TOP_SLACK) {
        e.preventDefault();
        setHeightPct(MIN_PCT);
      }
      return;
    }
    e.preventDefault();
    const goingUp = e.deltaY < 0;      // 위로 → 전체, 아래로 → 최소
    setHeightPct(goingUp ? MAX_PCT : MIN_PCT);
  };

  return (
    <div className="map-page-container">
      <LeafletMap minSheetHeight={MIN_PCT} headerHeight={101} parties={parties} navigate={navigate} />
      <Header/>
    <div
      ref={sheetRef}
      className="bottom-sheet"
      style={{
        height: `${heightPct}%`,
        // 펼쳐졌을 땐 내부 스크롤을 위해 터치 제스처를 브라우저에 위임
        // (접혀있을 땐 우리가 드래그 제스처를 처리)
        touchAction: 'none',
      }}
      onPointerDownCapture={onPointer}
      onPointerMoveCapture={onPointer}
      onPointerUpCapture={onPointer}
      onPointerCancelCapture={onPointer}
    >
      {/* grabber에서 시작하면 언제나 드래그 가능 */}
      <div className="grabber" data-grabber="true" />

      <div
        ref={sheetScrollRef} // ref 추가
        className="sheet-scroll"
        // 접혀있을 땐 시트만 드래그해야 하므로 내부 상호작용 차단
        style={{ 
          pointerEvents: (heightPct >= MAX_PCT) ? 'auto' : 'none',
          touchAction: 'none',
        }}
      >
        {/* ▶ 여기부터 목록 */}
        <ul className="party-list">
          {parties.map(p => (
            <li key={p.id}>
              <PartySmall
                {...p}
                onClick={() => navigate(`/parties/${p.id}`)} // 상세보기 버튼 클릭 시 이동
              />
            </li>
          ))}
        </ul>
        {/* ◀ 여기까지 */}
      </div>
    </div>
    <NavBar/>
    </div>
  );
}
