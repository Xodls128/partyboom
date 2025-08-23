import { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import './ProfileExtra.css';

import LeftIcon from '../assets/left_black.svg';
import UnderRed from '../assets/under_red.svg';
import UnderGray from '../assets/under_gray.svg';

const API_BASE = import.meta.env.VITE_API_URL;
const EXTRA_URL = `${API_BASE}/api/mypage/extra-settings/me/`;

// 첫번째 페이지 ( 학년 선택 )
const STEP1 = {
  title: '현재 나는...',
  key: 'grade',
  options: ['1학년','2학년','3학년','4학년','5학년','초과학기생','휴학생','대학원생'],
};
// 두번째 페이지 ( 단과대 선택 )
const STEP2 = {
  title: '내 단과대는?',
  key: 'college',
  options: [
    '글로벌인문·자연대학','사회과학대학','법과대학','경상대학',
    '공과대학','조형대학','과학기술대학','예술대학',
    '체육대학','경영대학','소프트웨어융합대학','건축대학',
  ],
};
// 세번째 페이지 ( 성격 선택 )
const STEP3 = {
  title: '나를 한 마디로 표현하면?',
  key: 'trait',
  options: ['활발한', '느긋한','주도적인','솔직한','열정적인','다정한','차분한','쾌활한'],
};
// 네번째 페이지 ( MBTI 선택 )
const STEP4 = {
  title: '마지막으로, 내 MBTI는...',
  key: 'mbti',
  pairs: [
    { group: 'IE', left: { v: 'I', label: '내향적인' }, right: { v: 'E', label: '외향적인' } },
    { group: 'NS', left: { v: 'N', label: '직관적인' }, right: { v: 'S', label: '현실적인' } },
    { group: 'FT', left: { v: 'F', label: '공감적인' }, right: { v: 'T', label: '이성적인' } },
    { group: 'PJ', left: { v: 'P', label: '즉흥적인' }, right: { v: 'J', label: '계획적인' } },
  ],
};

export default function ProfileExtra() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    grade: '',
    college: '',
    trait: '',
    mbti: { IE: '', NS:'', FT:'', PJ:''},
  });
  const [hasExisting, setHasExisting] = useState(false); // GET 성공 여부
  const savingRef = useRef(false); // 중복 저장 방지

  const goBack = () => {
    if (step===0) nav(-1);
    else setStep((s) => s-1);
  };

  const pick = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setTimeout(() => setStep((s) => Math.min(3, s + 1)), 100);
  };

  const pickMBTI = (group, value) => {
    setForm((f) => ({ ...f, mbti: { ...f.mbti, [group]: value } }));
  };

  const mbtiComplete = ['IE','NS','FT','PJ'].every(k => !!form.mbti[k]);

  // 1) 최초 로드: 기존 추가정보 조회(GET)
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('access');
      if (!token) return;

      try {
        const res = await fetch(EXTRA_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return; // 존재하지 않으면 그대로 진행(초기 POST 경로)

        const data = await res.json();
        // mbti 수신값: "INTP" 또는 분리필드 케이스도 보수적으로 대응
        const mbtiRaw =
          data.mbti ||
          [data.mbti_ie, data.mbti_ns, data.mbti_ft, data.mbti_pj].filter(Boolean).join('');

        setForm((f) => ({
          ...f,
          grade: data.grade ?? f.grade,
          college: data.college ?? f.college,
          trait: data.trait ?? f.trait,
          mbti: mbtiRaw && mbtiRaw.length === 4
            ? { IE: mbtiRaw[0], NS: mbtiRaw[1], FT: mbtiRaw[2], PJ: mbtiRaw[3] }
            : f.mbti,
        }));
        setHasExisting(true);
      } catch (e) {
        console.warn('추가정보 조회 실패:', e);
      }
    })();
  }, []);

  // 2) step===3 & MBTI 완료 → 저장(POST or PATCH) 후 완료 페이지로
  useEffect(() => {
    if (step !== 3 || !mbtiComplete || savingRef.current) return;

    const run = async () => {
      savingRef.current = true;

      const token = localStorage.getItem('access');
      if (!token) { alert('로그인이 필요합니다.'); return nav('/login'); }

      const headersJSON = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      const code = form.mbti.IE + form.mbti.NS + form.mbti.FT + form.mbti.PJ;
      const payload = {
        grade: form.grade,
        college: form.college,
        trait: form.trait,
        mbti: code,
      };

      try {
        const method = hasExisting ? 'PATCH' : 'POST';
        const res = await fetch(EXTRA_URL, {
          method,
          headers: headersJSON,
          body: JSON.stringify(payload),
        });

        // 혹시 서버가 초기 POST만 허용했는데 GET이 우연히 성공한 경우를 대비
        if (!res.ok && hasExisting) {
          const retry = await fetch(EXTRA_URL, {
            method: 'POST',
            headers: headersJSON,
            body: JSON.stringify(payload),
          });
          if (!retry.ok) throw new Error(`저장 실패: HTTP ${retry.status}`);
        } else if (!res.ok && !hasExisting) {
          throw new Error(`저장 실패: HTTP ${res.status}`);
        }

        nav('/mypage/extra/done', { replace: true, state: { form, mbtiCode: code } });
      } catch (e) {
        console.error(e);
        alert(e.message || '저장 중 오류가 발생했습니다.');
        savingRef.current = false; // 재시도 허용
      }
    };

    run();
  }, [step, mbtiComplete, form, nav, hasExisting]);

  const renderStep = () => {
    if (step === 0) {
      return (
        <ChoiceGrid
          title={STEP1.title}
          options={STEP1.options}
          value={form.grade}
          onSelect={(v) => pick(STEP1.key, v)}
        />
      );
    }
    if (step === 1) {
      return (
        <ChoiceGrid
          title={STEP2.title}
          options={STEP2.options}
          value={form.college}
          onSelect={(v) => pick(STEP2.key, v)}
          variant="college"
        />
      );
    }
    if (step === 2) {
      return (
        <ChoiceGrid
          title={STEP3.title}
          options={STEP3.options}
          value={form.trait}
          onSelect={(v) => pick(STEP3.key, v)}
        />
      );
    }
    // step 3 (MBTI)
    return (
      <div className="ex-wrap">
        <h1 className="ex-title">{STEP4.title}</h1>
        <div className="ex-mbti">
          {STEP4.pairs.map(({ group, left, right }) => (
            <div key={group} className="ex-mbti-row">
              <Choice
                active={form.mbti[group] === left.v}
                onClick={() => pickMBTI(group, left.v)}
                label={<strong className="ex-mbti-letter">{left.v}</strong>}
                sub={left.label}
              />
              <Choice
                active={form.mbti[group] === right.v}
                onClick={() => pickMBTI(group, right.v)}
                label={<strong className="ex-mbti-letter">{right.v}</strong>}
                sub={right.label}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="ex-page">
      <header className="ex-top">
        <button type="button" className="ex-back" onClick={goBack} aria-label="뒤로가기">
          <img src={LeftIcon} alt="" />
        </button>
      </header>

      {renderStep()}

      {/* 하단 진행 표시 */}
      <div className="ex-progress">
        {[0,1,2,3].map((i) => (
          <img
            key={i}
            className="ex-bar"
            src={step === i ? UnderRed : UnderGray}
            alt={step === i ? `현재 ${i+1}단계` : `${i+1}단계`}
            draggable="false"
          />
        ))}
      </div>
    </div>
  );
}

function ChoiceGrid({ title, options, value, onSelect, variant }) {
  return (
    <div className="ex-wrap">
      <h1 className="ex-title">{title}</h1>
      <div className={`ex-grid ${variant === 'college' ? 'ex-grid--college' : ''}`}>
        {options.map((opt) => (
          <Choice
            key={opt}
            active={value === opt}
            onClick={() => onSelect(opt)}
            label={opt}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}

function Choice({ active, onClick, label, sub, variant }) {
  return (
    <button
      type="button"
      className={`ex-chip ${active ? 'on' : ''} ${variant === 'college' ? 'ex-chip--college' : ''}`}
      onClick={onClick}
    >
      <span className="ex-chip-label">{label}</span>
      {sub && <span className="ex-chip-sub">{sub}</span>}
    </button>
  );
}
