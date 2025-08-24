import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // useAuth 훅 임포트
import './LoginSignup.css';
import LeftIcon from '../assets/left_black.svg';
import EyeIcon from '../assets/visibility.svg';
import BombMark from '../assets/boomb.svg';
import Wordmark from '../assets/logo.svg';
import api from "../api/axios";

export default function Login(){
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const { login } = useAuth(); // AuthContext의 login 함수 사용

  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if(!id || !pw) return alert('아이디와 비밀번호를 입력해 주세요.');

    try {
      setLoading(true);
      const { data } = await api.post("/api/signup/auth/login/", {
        username: id,
        password: pw,
      });

      // context의 login 함수를 호출하여 로그인 처리
      await login(data.access, data.refresh);

      alert("로그인 성공");
      nav(from, { replace: true }); // 로그인 전 페이지 or 홈으로 이동
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "아이디 또는 비밀번호가 일치하지 않습니다.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-top">
        <button className="auth-back" onClick={()=>nav(-1)} aria-label="뒤로가기">
          <img src={LeftIcon} alt="" />
        </button>
        <h1 className="auth-title">로그인</h1>
      </header>

      <main className="auth-form" role="form" onSubmit={submit}>
        <div className="lg-logo">
          <img className="lg-logo__bomb" src={BombMark} alt="" aria-hidden="true" />
          <img className="lg-logo__word" src={Wordmark} alt="파티붐" />
        </div>

        <div className="auth-field">
          <input
            className="auth-input"
            value={id}
            onChange={e=>setId(e.target.value)}
            placeholder="아이디"
          />
        </div>

        <div className="auth-field">
          <div className="auth-input-wrap">
            <input
              className="auth-input"
              type={show ? 'text':'password'}
              value={pw}
              onChange={e=>setPw(e.target.value)}
              placeholder="비밀번호"
            />
            <img
              className="auth-eye"
              src={EyeIcon}
              alt=""
              onClick={()=>setShow(s=>!s)}
            />
          </div>
        </div>

        <div className="auth-actions">
          <button className="auth-btn auth-btn--primary" onClick={submit} disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </div>

        <div className="switch-auth-prompt" style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          회원이 아니신가요? <Link to="/signup" style={{ color: '#FF3B77', textDecoration: 'underline' }}>이메일로 회원가입</Link>
        </div>
      </main>
    </div>
  );
}