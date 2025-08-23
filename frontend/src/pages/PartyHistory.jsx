import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PartyHistory.css';
import LeftBlack from '../assets/left_black.svg';
import PartySmallAfter from './PartySmallAfter';
import PartySmallImages from '../assets/partysmall.jpg';
import ReviewModal from './ReviewModal.jsx';

const API_BASE = import.meta.env.VITE_API_URL;
const HISTORY_URL = `${API_BASE}/api/partyassist/myparties/`;

export default function PartyHistory() {
  const navigate = useNavigate();

  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const token = useMemo(() => localStorage.getItem('access'), []);
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const goBack = () => navigate(-1);

  // 참여 이력 조회
  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        if (!token) throw new Error('로그인이 필요합니다.');
        const res = await fetch(HISTORY_URL, { headers: authHeaders });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json().catch(() => []);

        const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
        const mapped = list.map((it) => {
          const p = it.party || it;
          const id = p.id ?? it.id;
          const title = '#' + (p.title || p.name || `파티_${id ?? ''}`);
          const date = p.start_time || it.start_time || p.started_at || it.started_at || '';
          const location = p.place_name || it.place_name || p.location_name || it.location_name || '';
          const thumbnailUrl = p.place_photo || p.thumbnail || PartySmallImages;
          const current = p.applied_count ?? it.applied_count ?? p.current_participants ?? it.current_participants ?? 0;
          const capacity = p.max_participants ?? it.max_participants ?? p.capacity ?? it.capacity ?? 0;
          return { id, title, date, location, thumbnailUrl, current, capacity, _raw: it };
        });

        if (!aborted) setHistoryData(mapped);
      } catch (e) {
        if (!aborted) setErr(e.message || '데이터를 불러오지 못했습니다.');
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  // 모달 열기/닫기
  const onOpen = (party) => { setSelected(party); setOpen(true); };

  return (
    <div className="history-page">
      <header className="history-header">
        <button className="back-button" onClick={goBack}>
          <img src={LeftBlack} alt="back" className="back-icon" />
        </button>
        <h1 className="header-title">참여이력</h1>
      </header>

      <section className="history-list">
        {loading && <div className="history-loading">불러오는 중…</div>}
        {(!loading && err) && <div className="history-error">에러: {err}</div>}
        {(!loading && !err && historyData.length === 0) && (
          <div className="history-empty">참여 이력이 없습니다.</div>
        )}

        {historyData.map((party) => (
          <PartySmallAfter
            key={party.id}
            title={party.title}
            date={party.date}
            location={party.location}
            thumbnailUrl={party.thumbnailUrl}
            current={party.current}
            capacity={party.capacity}
            onClick={() => onOpen(party)}
          />
        ))}
      </section>

      <ReviewModal
        open={open}
        onClose={() => setOpen(false)}
        partyId={selected?.id}
        partyTitle={selected?.title ?? ''}
        onSuccess={() => {
          setOpen(false);
          alert('리뷰가 제출되었습니다!');
        }}
      />
    </div>
  );
}
