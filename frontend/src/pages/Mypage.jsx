import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Mypage.css';
import Header from '../components/Header.jsx';
import NavBar from '../components/NavBar.jsx';

import Vector from '../assets/Vector.svg';
import Info from '../assets/info.svg';
import RigthBlack from '../assets/right_black.svg';

import LoginRequest from "../components/LoginRequest"; // 로그인 모달 추가

const API_BASE = import.meta.env.VITE_API_URL;
const MAIN_URL = `${API_BASE}/api/mypage/main/`;
const AUTH_SCHEME = 'JWT';

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
    } catch {
      return '';
    }
  })();

export default function Mypage() {
  const navigate = useNavigate();
  const token = getToken();
  const isLoggedIn = !!token;

  // userInfo 객체 하나로 통합 상태 관리
  const [userInfo, setUserInfo] = useState({
    username: '게스트',
    intro: '한 줄 소개를 작성해주세요',
    points: 0,
    avatarUrl: '',
    tags: ['소속학년', '소속대학', '성격', 'MBTI'],
    participationCount: 0,
    warningCount: 0,
  });

  // 툴팁 상태
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isWarningTooltipVisible, setIsWarningTooltipVisible] = useState(false);
  const onTooltipClick = () => setIsTooltipVisible((v) => !v);
  const onWarningTooltipClick = () => setIsWarningTooltipVisible((v) => !v);

  const handleParticipationClick = () => navigate('/mypage/history');

  // 로그아웃 함수
  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    sessionStorage.removeItem('access');
    localStorage.removeItem('auth');
    localStorage.removeItem('user');

    navigate('/');
  };

  // 로그인 안 됐으면 모달
  if (!isLoggedIn) {
    return (
      <LoginRequest
        isOpen={true}
        onClose={() => navigate('/')}
        redirectTo="/mypage"
      />
    );
  }

  // 마운트 시 API 호출
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(MAIN_URL, {
          headers: {
            Authorization: `${AUTH_SCHEME} ${token}`,
            Accept: 'application/json',
          },
        });
        if (!res.ok) {
          console.error('마이페이지 호출 실패:', res.status);
          return;
        }

        const data = await res.json();

        // MBTI 가공
        const mbtiObj = data.mbti || {};
        const mbtiString = [mbtiObj.i_e, mbtiObj.n_s, mbtiObj.f_t, mbtiObj.p_j]
          .filter(Boolean)
          .join('');

        setUserInfo({
          username: data.name || '게스트',
          intro: data.intro || '한 줄 소개를 작성해주세요',
          points: Number(data.points ?? 0),
          avatarUrl: data.profile_image || Vector,
          tags: [
            data.grade || '소속학년',
            data.college || '소속대학',
            data.personality || '성격',
            mbtiString || 'MBTI',
          ],
          participationCount: Number(data.participation_count ?? 0),
          warningCount: Number(data.warnings ?? 0),
        });
      } catch (e) {
        console.error('유저 정보를 불러오는 중 오류:', e);
      }
    })();
  }, [token]);

  return (
    <>
      <Header />
      <div className="profile-page">
        {/* 1. 프로필 정보 섹션 */}
        <section className="profile-info">
          <div className="profile-photo-group">
            <div className="profile-image-wrap">
              <img
                src={userInfo.avatarUrl || Vector}
                alt="프로필 이미지"
                className="profile-image-svg"
              />
            </div>
            <button
              className="edit-button"
              onClick={() => navigate('/mypage/edit')}
            >
              수정하기
            </button>
          </div>

          <div className="profile-details">
            <div className="name-and-intro-container">
              <p className="profile-name">{userInfo.username}</p>
              <p className="profile-perinfo">{userInfo.intro}</p>
            </div>
            <div className="profile-tags">
              {userInfo.tags.map((t, i) => (
                <span className="profile-tag" key={i}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 2. 포인트 정보 섹션 */}
        <section className="point-section">
          <p>포인트</p>
          <div className="point-value-group">
            <p>{userInfo.points.toLocaleString('ko-KR')}P</p>
            <img
              src={Info}
              alt="info 이미지"
              className="info-image-svg"
              onClick={onTooltipClick}
            />
          </div>
          {isTooltipVisible && (
            <div className="tooltip">
              <p>
                포인트는 파티붐 서비스 활동을 통해
                <br />
                획득하거나 사용할 수 있는 재화입니다.
              </p>
            </div>
          )}
        </section>

        {/* 3. 참여 횟수 및 경고 섹션 */}
        <section className="profile-stats">
          <div className="stat-item" onClick={handleParticipationClick}>
            <p>참여횟수</p>
            <p className="stat-value">
              {userInfo.participationCount}{' '}
              <img
                src={RigthBlack}
                alt="right 이미지"
                className="right-image-svg"
              />
            </p>
          </div>
          <div className="stat-item">
            <p>경고</p>
            <p className="stat-value" onClick={onWarningTooltipClick}>
              {userInfo.warningCount}
              <img src={Info} alt="info 이미지" className="info-image-svg" />
            </p>
            {isWarningTooltipVisible && (
              <div className="tooltip warning-tooltip">
                <p>경고는 서비스 이용 규칙을 위반했을 때 부여됩니다.</p>
              </div>
            )}
          </div>
        </section>

        {/* 4. 설정 메뉴 섹션 */}
        <section className="profile-menu">
          <ul className="menu-list">
            <li>도움말</li>
            <li onClick={handleLogout} style={{ cursor: 'pointer' }}>
              로그아웃
            </li>
            <li className="delete_account">계정 탈퇴</li>
          </ul>
        </section>
      </div>
      <NavBar />
    </>
  );
}
