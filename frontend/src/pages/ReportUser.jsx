import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import './ReportUser.css';
import LeftIcon from '../assets/left_black.svg';
import BelowArrow from '../assets/below_arrow.svg';

export default function ReportUser() {
  const nav = useNavigate();
  const location = useLocation();
  const { userId: paramId } = useParams();

  // 목록에서 넘어온 유저 (state), 없으면 파라미터로 대체
  const fromState = location.state?.user;
  const user =
    fromState || {
      id: paramId || '',
      name: fromState?.name || '김00',
      photo: fromState?.photo || '',
      partyId: fromState?.partyId || null,
    };

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(''); // 이제 enum 코드 저장 (ex: FAKE_INFO)
  const [detail, setDetail] = useState('');
  const [categories, setCategories] = useState([]); 
  const [message, setMessage] = useState(null); // 사용자 메시지 상태

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // 신고 유형 목록 불러오기 (DRF OPTIONS)
  useEffect(() => {
    fetch(`${API_BASE}/api/mypage/reports/`, {
      method: 'OPTIONS',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.actions?.POST?.category?.choices) {
          setCategories(data.actions.POST.category.choices);
        }
      })
      .catch((err) => console.error('신고 유형 불러오기 실패', err));
  }, []);

  const submit = async () => {
    if (!reason) return setMessage('신고 유형을 선택해 주세요.');
    if (!detail.trim())
      return setMessage('예) 파티 현장에서 불쾌한 신체접촉이 있었고, 프로필 상의 내용과 실제 개인 정보가 다릅니다.');
    if (!user.partyId) return setMessage('신고가 발생한 파티 정보가 없습니다.');

    try {
      const response = await fetch(`${API_BASE}/api/mypage/reports/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access')}`, // JWT 토큰
        },
        body: JSON.stringify({
          party: user.partyId,
          reported_user: user.id,
          category: reason, // 이제 그대로 enum 코드 전송
          content: detail,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error('신고 실패:', err);
        return alert(err.detail || '신고 중 오류가 발생했습니다.');
      }

      setMessage('신고가 접수되었습니다.');
      setTimeout(() => nav(-1), 1500); // 1.5초 뒤 자동 이동
    } catch (err) {
      console.error(err);
      setMessage('신고 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="ru-page" onClick={() => setOpen(false)}>
      <header className="ru-top" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="ru-back"
          onClick={() => nav(-1)}
          aria-label="뒤로가기"
        >
          <img src={LeftIcon} alt="" />
        </button>
        <h1 className="ru-title">회원 신고하기</h1>
      </header>

      <main className="ru-main" onClick={(e) => e.stopPropagation()}>
        <div className="ru-profile">
          {user.photo ? (
            <img
              className="ru-avatar"
              src={user.photo}
              alt={`${user.name} 프로필`}
            />
          ) : (
            <div className="ru-avatar ru-avatar--placeholder" />
          )}
          <div className="ru-name">{user.name}</div>
        </div>

        <section className="ru-field">
          <label className="ru-label">신고 유형</label>
          <div
            className={`ru-select ${open ? 'open' : ''}`}
            onClick={() => setOpen(!open)}
          >
            <span className={`ru-placeholder ${reason ? 'has' : ''}`}>
              {reason
                ? categories.find((c) => c.value === reason)?.display_name
                : '신고 유형을 선택해 주세요.'}
            </span>
            <img
              className="ru-caret"
              src={BelowArrow}
              alt=""
              aria-hidden="true"
            />
            {open && (
              <ul className="ru-menu" role="listbox" aria-label="신고 유형">
                {categories.map((c) => (
                  <li
                    key={c.value}
                    role="option"
                    aria-selected={reason === c.value}
                    className="ru-option"
                    onClick={() => {
                      setReason(c.value);
                      setOpen(false);
                    }}
                  >
                    {c.display_name}
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
        {/* 메시지 표시 영역 */}
        {message && <div className="ru-message">{message}</div>}
      </main>

      <div className="ru-actions" onClick={(e) => e.stopPropagation()}>
        <button className="ru-submit" onClick={submit}>
          신고하기
        </button>
      </div>
    </div>
  );
}
