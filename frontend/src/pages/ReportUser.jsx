import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import './ReportUser.css';
import LeftIcon  from '../assets/left_black.svg'; 
import BelowArrow from '../assets/below_arrow.svg';    

const REASONS = [
  '개인정보 허위 기재',
  '파티 현장에서의 불쾌감 형성',
  '파티 현장에서의 부적절한 행위',
  '부적절한 프로필 사진',
  '기타',
];

export default function ReportUser() {
  const nav = useNavigate();
  const location = useLocation();
  const { userId: paramId } = useParams();

  // 목록에서 넘어온 유저 (state), 없으면 파라미터로 대체
  const fromState = location.state?.user;
  const user = fromState || { id: paramId || '', name: fromState?.name || '김00', photo: fromState?.photo || '' };

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const submit = async () => {
    if (!reason) return alert('신고 유형을 선택해 주세요.');
    if (!detail.trim()) return alert('신고 내용을 입력해 주세요.');
    if (!user.partyId) return alert('신고가 발생한 파티 정보가 없습니다.');

    try {
      const response = await fetch(`${API_BASE}/api/mypage/reports/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access")}`, // JWT 토큰
        },
        body: JSON.stringify({
          party: user.partyId,
          reported_user: user.id,
          category: REASON_MAP[reason] || 'OTHER',
          content: detail,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("신고 실패:", err);
        return alert(err.detail || "신고 중 오류가 발생했습니다.");
      }

      alert("신고가 접수되었습니다.");
      nav(-1);
    } catch (err) {
      console.error(err);
      alert("신고 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="ru-page" onClick={() => setOpen(false)}>
      <header className="ru-top" onClick={(e)=>e.stopPropagation()}>
        <button type="button" className="ru-back" onClick={() => nav(-1)} aria-label="뒤로가기">
          <img src={LeftIcon} alt="" />
        </button>
        <h1 className="ru-title">회원 신고하기</h1>
      </header>

      <main className="ru-main" onClick={(e)=>e.stopPropagation()}>
        <div className="ru-profile">
          {user.photo
            ? <img className="ru-avatar" src={user.photo} alt={`${user.name} 프로필`} />
            : <div className="ru-avatar ru-avatar--placeholder" />
          }
          <div className="ru-name">{user.name}</div>
        </div>

        <section className="ru-field">
          <label className="ru-label">신고 유형</label>
          <div className={`ru-select ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
            <span className={`ru-placeholder ${reason ? 'has' : ''}`}>
              {reason || '신고 유형을 선택해 주세요.'}
            </span>
            <img className="ru-caret" src={BelowArrow} alt="" aria-hidden="true" />
            {open && (
              <ul className="ru-menu" role="listbox" aria-label="신고 유형">
                {REASONS.map((r) => (
                  <li
                    key={r}
                    role="option"
                    aria-selected={reason === r}
                    className="ru-option"
                    onClick={() => { setReason(r); setOpen(false); }}
                  >
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="ru-field">
          <label className="ru-label">신고 내용</label>
          <textarea
            className="ru-textarea"
            placeholder={`예) 파티 현장에서 불쾌한 신체접촉이 있었고,\n프로필 상의 내용과 실제 개인 정보가 다릅니다.`}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={5}
          />
        </section>
      </main>

      <div className="ru-actions" onClick={(e)=>e.stopPropagation()}>
        <button className="ru-submit" onClick={submit}>신고하기</button>
      </div>
    </div>
  );
}
