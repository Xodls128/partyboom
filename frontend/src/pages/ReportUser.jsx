import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import './ReportUser.css';
import LeftIcon from '../assets/left_black.svg';
import BelowArrow from '../assets/below_arrow.svg';
import api from "../api/axios";
import ParticiProfile from '../assets/partici_profile.svg';

const REPORT_CATEGORIES = [
  { value: "FAKE_INFO", display_name: "개인정보 허위 기재" },
  { value: "UNPLEASANT", display_name: "파티 현장에서의 불쾌감 형성" },
  { value: "INAPPROPRIATE_ACT", display_name: "파티 현장에서의 부적절한 행위" },
  { value: "BAD_PHOTO", display_name: "부적절한 프로필 사진" },
  { value: "OTHER", display_name: "기타" },
];

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
  const [reason, setReason] = useState(''); 
  const [detail, setDetail] = useState('');
  const [categories] = useState(REPORT_CATEGORIES);
  const [toast, setToast] = useState(null); 



  const submit = async () => {
    if (!reason) {
      setToast({ text: "⚠️ 신고 유형을 선택해 주세요.", type: "error" });
      setTimeout(() => setToast(null), 1500);
      return;
    }
    if (!detail.trim()) {
      setToast({ text: "⚠️ 신고 내용을 입력해 주세요.", type: "error" });
      setTimeout(() => setToast(null), 1500);
      return;
    }
    if (!user.partyId) {
      setToast({ text: "⚠️ 신고가 발생한 파티 정보가 없습니다.", type: "error" });
      setTimeout(() => setToast(null), 1500);
      return;
    }

    try {
      // (수정 #1) fetch → axios.post
      const response = await api.post("/api/mypage/reports/", {
        party: user.partyId,
        reported_user: user.id,
        category: reason,
        content: detail,
      });

      // (수정 #2) axios는 ok 여부 대신 catch로 에러 잡음 → 성공 처리
      setToast({ text: "✅ 신고가 접수되었습니다.", type: "success" });
      setTimeout(() => {
        setToast(null);
        nav(-1);
      }, 1500);
    } catch (err) {
      // (수정 #3) axios 에러 구조
      const detailMsg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "❌ 신고 중 오류가 발생했습니다.";
      console.error("신고 실패:", err.response?.data || err);
      setToast({ text: detailMsg, type: "error" });
      setTimeout(() => setToast(null), 1500);
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
          <img
            className="ru-avatar"
            src={user.photo || ParticiProfile}   // (수정) 유저 사진 없으면 fallback
            alt={`${user.name} 프로필`}
          />
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

        {/* 토스트 메시지 */}
        {toast && (
          <div className={`ru-toast ${toast.type}`}>
            {toast.text}
          </div>
        )}
      </main>

      <div className="ru-actions" onClick={(e) => e.stopPropagation()}>
        <button className="ru-submit" onClick={submit}>
          신고하기
        </button>
      </div>
    </div>
  );
}
