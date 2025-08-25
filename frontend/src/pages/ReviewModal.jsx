import { useEffect, useState } from 'react';
import './ReviewModal.css';
import StarEmpty from '../assets/review.svg';
import StarFull  from '../assets/review_full.svg';
import CloseIcon from '../assets/close.svg';

const API_BASE = import.meta.env.VITE_API_URL; 
const REVIEW_URL = `${API_BASE}/api/mypage/reviews/`;
const AUTH_SCHEME = 'Bearer'; 

// 저장된 토큰 구하기
const getToken = () =>
  localStorage.getItem('access') ||
  localStorage.getItem('accessToken') ||
  localStorage.getItem('token') ||
  sessionStorage.getItem('access') ||
  (() => {
    try {
      const pick = (k) => {
        const raw = localStorage.getItem(k);
        if (!raw) return null;
        const o = JSON.parse(raw);
        return o?.access || o?.token || o?.access_token || null;
      };
      return pick('auth') || pick('user') || '';
    } catch { return ''; }
  })();

function StarRow({ label, value, onChange }) {
  return (
    <div className="rv-row">
      <p className="rv-label">{label}</p>
      <div className="rv-stars" role="radiogroup" aria-label={label}>
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            type="button"
            className="rv-star-btn"
            aria-checked={n === value}
            aria-label={`${n}점`}
            onClick={() => onChange(n)}
          >
            <img
              src={n <= value ? StarFull : StarEmpty}
              alt=""
              aria-hidden="true"
              className="rv-star-img"
              draggable="false"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewModal({
  open,
  onClose = () => {},
  partyId,
  onSuccess = () => {},
}) {
  const [fun, setFun] = useState(0);
  const [people, setPeople] = useState(0);
  const [place, setPlace] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    // 초기화
    setFun(0); setPeople(0); setPlace(0); setText('');
    setSubmitting(false); setErr('');

    // 바디 스크롤 잠금
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (submitting) return;
    if (!partyId) return alert('리뷰 대상 파티 정보를 찾을 수 없습니다.');

    const token = getToken();
    if (!token) return alert('로그인이 필요합니다.');
    if (fun === 0 || people === 0 || place === 0) {
      return alert('별점을 모두 선택해 주세요.');
    }

    setSubmitting(true);
    setErr('');

    // 서버 명세에 맞춘 payload
    const payload = {
      party: partyId,
      q1_rating: fun,
      q2_rating: people,
      q3_rating: place,
      comment: text ?? '',
    };

    try {
      const res = await fetch(REVIEW_URL, {
        method: 'POST',
        headers: {
          Authorization: `${AUTH_SCHEME} ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.q1_rating || data?.q2_rating || data?.q3_rating) {
          throw new Error("모든 항목에 별점을 입력해주세요.");
        }
        throw new Error(data?.detail || `리뷰 제출 실패(HTTP ${res.status})`);
      }

      onSuccess?.();
    } catch (e) {
      console.error(e);
      setErr(e.message || '리뷰 제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rv-backdrop" onClick={onClose}>
      <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rv-close" onClick={onClose} aria-label="닫기">
          <img src={CloseIcon} alt="" aria-hidden="true" className="rv-close-ic" draggable="false" />
        </button>

        <StarRow label="파티는 재밌게 즐기셨나요?" value={fun} onChange={setFun} />
        <StarRow label="함께한 참여자들은 어땠나요?" value={people} onChange={setPeople} />
        <StarRow label="파티 장소는 마음에 드셨나요?" value={place} onChange={setPlace} />

        <textarea
          className="rv-textarea"
          placeholder="파티에 대한 의견이 있다면 자유롭게 남겨주세요."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />

        {err && <div className="history-error" style={{ marginTop: 8 }}>{err}</div>}

        <button
          type="button"
          className="rv-submit"
          onClick={submit}
          disabled={submitting}
        >
          제출하기
        </button>
      </div>
    </div>
  );
}
