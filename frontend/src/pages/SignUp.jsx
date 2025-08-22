import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSignup.css';
import LeftIcon from '../assets/left_black.svg';
import EyeIcon from '../assets/visibility.svg';

const DRAFT_KEY = 'signupDraftV1';

export default function Signup() {
  const nav = useNavigate();

  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);


  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpOk, setOtpOk] = useState(false);
  const [school, setSchool] = useState('');
  const [cardFile, setCardFile] = useState(null);
  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      setName(d.name || '');
      setUserId(d.userId || '');
      setPw(d.pw || '');
      setPw2(d.pw2 || '');
      setEmail(d.email || '');
      setPhone(d.phone || '');
      setSchool(d.school || '');
      setAgree(!!d.agree);
    } catch (e) {
       if (import.meta.env.DEV) console.warn('draft parse error:', e);
    }
  }, []);

  const saveDraft = (patch = {}) => {
    const next = {
      name, userId, pw, pw2, email, phone, school, agree,
      ...patch,
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  };

  // OTP
  const sendOtp = async () => {
    if (!phone) return alert('전화번호를 입력해 주세요.');
    // API 연동 
    setOtpSent(true);
    alert('[MOCK] 인증번호를 전송했습니다.');
  };

  const verifyOtp = async () => {
    if (!otp) return;
    // API 연동 
    setOtpOk(true);
    alert('[MOCK] 전화번호 인증이 완료되었습니다.');
  };

  // 최종 가입
  const submit = async () => {
    if (!name || !userId || !pw || !pw2) return alert('기본정보를 모두 입력해 주세요.');
    if (pw.length < 8) return alert('비밀번호는 8자 이상이어야 합니다.');
    if (pw !== pw2) return alert('비밀번호가 일치하지 않습니다.');

    if (!email || !phone || !school) return alert('추가정보를 모두 입력해 주세요.');
    if (!otpOk) return alert('전화번호 인증을 완료해 주세요.');
    if (!cardFile) return alert('학생증 사진을 업로드해 주세요.');
    if (!agree) return alert('개인정보 처리방침에 동의해 주세요.');

    // API 연동 
    const formData = new FormData();
    formData.append("username", userId);           // 백엔드 User 모델 username 필드
    formData.append("password", pw);               // 비밀번호
    formData.append("password2", pw2);             // 비밀번호 확인
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("school", school);
    formData.append("student_card_image", cardFile); // 📎 파일 업로드

    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/signup/auth/signup/`, {
        method: "POST",
        body: formData, // multipart/form-data 자동 적용됨
      });

      if (!res.ok) {
        // 실패 시 서버 응답(JSON)을 파싱해서 사용자에게 보여줌
        const err = await res.json().catch(() => ({}));
        console.error("회원가입 실패:", err);
        throw new Error(err?.detail || "회원가입에 실패했습니다.");
      }

      const data = await res.json();
      console.log("회원가입 성공:", data);

      alert("회원가입이 완료되었습니다. 로그인해 주세요.");
      sessionStorage.removeItem(DRAFT_KEY);
      nav("/login", { replace: true }); // 로그인 페이지로 이동
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-top">
        <button className="auth-back" onClick={() => nav(-1)} aria-label="뒤로가기">
          <img src={LeftIcon} alt="" />
        </button>
        <h1 className="auth-title">회원가입</h1>
      </header>

      <section className="su-section">
        <div className="auth-form">
          <div className="auth-field">
            <label>이름</label>
            <input className="auth-input"
              value={name}
              onChange={e => { setName(e.target.value); saveDraft({ name: e.target.value }); }}/>
          </div>

          <div className="auth-field">
            <label>아이디</label>
            <input className="auth-input"
              value={userId}
              onChange={e => { setUserId(e.target.value); saveDraft({ userId: e.target.value }); }} />
          </div>

          <div className="auth-field">
            <label>비밀번호</label>
            <div className="auth-input-wrap">
              <input className="auth-input"
                type={showPw1 ? 'text' : 'password'}
                value={pw}
                onChange={e => { setPw(e.target.value); saveDraft({ pw: e.target.value }); }}/>
              <img className="auth-eye" src={EyeIcon} alt="" onClick={() => setShowPw1(s => !s)} />
            </div>
            <div className="auth-helper">영문/숫자/특수문자 조합 8자 이상 권장</div>
          </div>

          <div className="auth-field">
            <label>비밀번호 확인</label>
            <div className="auth-input-wrap">
              <input className="auth-input"
                type={showPw2 ? 'text' : 'password'}
                value={pw2}
                onChange={e => { setPw2(e.target.value); saveDraft({ pw2: e.target.value }); }} />
              <img className="auth-eye" src={EyeIcon} alt="" onClick={() => setShowPw2(s => !s)} />
            </div>
          </div>
        </div>
        
        <div className="auth-field">
            <label>이메일</label>
            <input className="auth-input"
              value={email}
              onChange={e => { setEmail(e.target.value); saveDraft({ email: e.target.value }); }}/>
        </div>

        <div className="auth-field">
            <label>전화번호</label>
            <div className="auth-otp-row">
              <input className="auth-input"
                value={phone}
                onChange={e => { setPhone(e.target.value); saveDraft({ phone: e.target.value }); }}/>
              <button className="auth-btn auth-btn--ghost" type="button" onClick={sendOtp}>전화번호 인증</button>
            </div>
            {otpSent && (
              <div className="auth-otp-row" style={{ marginTop: 8 }}>
                <input className="auth-input"
                  value={otp}
                  onChange={e => setOtp(e.target.value)} />
                <button className="auth-btn auth-btn--ghost" type="button" onClick={verifyOtp}>
                  인증
                </button>
              </div>
            )}
        </div>

        <div className="auth-field">
            <label>학교</label>
            <input className="auth-input"
              value={school}
              onChange={e => { setSchool(e.target.value); saveDraft({ school: e.target.value }); }} />
        </div>


        <div className="auth-field">
            <label className="sr-only" htmlFor="cardFile">학생증 사진 업로드</label>
            <input
                id="cardFile"
                className="auth-file"
                type="file"
                accept="image/*"
                onChange={(e)=> setCardFile(e.target.files?.[0] || null)}
            />
            <label
                htmlFor="cardFile"
                className={`file-btn ${cardFile ? 'is-selected' : ''}`}>
                학생증 사진 업로드
            </label>
            {cardFile && <div className="file-meta">{cardFile.name}</div>}
            <p className="auth-note">
                * 본인 인증을 위해 학생증 사진을 수집 및 이용합니다. 수집된 정보는 인증 목적 외에는 사용되지 않으며, 인증 이후 폐기됩니다.
            </p>
        </div>


        <label className="auth-checkbox">
            <input type="checkbox" checked={agree}
              onChange={e => { setAgree(e.target.checked); saveDraft({ agree: e.target.checked }); }} />
            개인정보 처리방침을 확인하였으며 이에 동의합니다.
        </label>

        <div className="auth-actions">
            <button className="auth-btn auth-btn--sign" onClick={submit} disabled={loading}>
              가입하기
            </button>
        </div>
      </section>
    </div>
  );
 }
