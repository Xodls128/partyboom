import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './LoginSignup.css';
import LeftIcon from '../assets/left_black.svg';
import EyeIcon from '../assets/visibility.svg';
import BombMark from '../assets/boomb.svg';
import Wordmark from '../assets/logo.svg';
import api from "@/api/axios"; // axios 인스턴스 사용

export default function Login(){
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if(!id || !pw) return alert('아이디와 비밀번호를 입력해 주세요.');

    try {
      setLoading(true);
      // axios로 로그인 요청
      const { data } = await api.post("/api/signup/auth/login/", {
        username: id,   // 백엔드 로그인 필드는 username/password
        password: pw,
      });

      console.log("로그인 성공:", data);

      // 토큰과 유저정보를 localStorage에 저장
      localStorage.setItem("access", data.access); // 토큰 변수명 통일
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("로그인 성공");
      nav(from, { replace: true }); // 로그인 전 페이지 or 홈으로 이동
    } catch (err) {
      let message = "로그인 실패";
      if (err.response) {
        // 서버가 응답했지만 상태 코드가 실패인 경우
        message = err.response.data?.detail || JSON.stringify(err.response.data);
      } else if (err.request) {
        // 요청을 보냈는데 응답이 없는 경우
        message = "서버 응답이 없습니다. 네트워크를 확인해주세요.";
      } else {
        // 그 외 (코드 오류 등)
        message = err.message || "알 수 없는 오류가 발생했습니다.";
      }
      alert(message);
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
      </main>
    </div>
  );
}