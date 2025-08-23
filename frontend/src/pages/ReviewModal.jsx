import { useEffect, useState } from 'react';
import './ReviewModal.css';
import StarEmpty from '../assets/reivew.svg';
import StarFull  from '../assets/review_full.svg';
import CloseIcon from '../assets/close.svg';

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
  onSubmit = () => {},                   
}) {
  const [fun, setFun] = useState(0);
  const [people, setPeople] = useState(0);
  const [place, setPlace] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!open) return;
    setFun(0); setPeople(0); setPlace(0); setText('');
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const submit = () => onSubmit({ fun, people, place, text });

  return (
    <div className="rv-backdrop" onClick={onClose}>
      <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rv-close" onClick={onClose} aria-label="닫기">
          <img src={CloseIcon} alt="" aria-hidden="true" className="rv-close-ic" draggable="false" /> {/* ✅ */}
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

        <button type="button" className="rv-submit" onClick={submit}>제출하기</button> {/* ✅ */}
      </div>
    </div>
  );
}
