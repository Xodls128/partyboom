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

// 저장된 토큰 구하기(여러 키 대응)
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

  // 상태
  const [username, setUsername] = useState('게스트');
  const [intro, setIntro] = useState('한 줄 소개를 작성해주세요');
  const [tags, setTags] = useState(['소속학년', '소속대학', '성격', 'MBTI']);
  const [points, setPoints] = useState(0);
  const [participationCount, setParticipationCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');

  // 툴팁
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isWarningTooltipVisible, setIsWarningTooltipVisible] = useState(false);
  const onTooltipClick = () => setIsTooltipVisible((v) => !v);
  const onWarningTooltipClick = () => setIsWarningTooltipVisible((v) => !v);

  const handleParticipationClick = () => navigate('/mypage/history');

  // 로그인 체크
  const token = getToken();
  const isLoggedIn = !!token;

  if (!isLoggedIn) {
    return (
      <LoginRequest 
        isOpen={true} 
        onClose={() => navigate('/')} 
        redirectTo="/mypage"   // 로그인 성공 후 다시 돌아올 경로
      />
    );
  }

  // 마운트 시 한 번만: /api/mypage/main/에서 프로필+요약 모두 세팅
  useEffect(() => {
    (async () => {
      if (!token) {
        console.warn('[Mypage] 토큰 없음(미로그인/만료)');
        return;
      }

      try {
        const res = await fetch(MAIN_URL, {
          headers: {
            Authorization: `${AUTH_SCHEME} ${token}`,
            Accept: 'application/json',
          },
        });
        if (res.status === 401) {
          console.warn('401: 로그인 필요/토큰 만료');
          return;
        }
        if (!res.ok) {
          console.error('마이페이지 호출 실패:', res.status);
          return;
        }

        const data = await res.json();

        // 프로필
        setUsername(data.nickname || data.username || '게스트');
        setIntro(data.intro || data.bio || '');
        setAvatarUrl(data.profile_image || data.avatar_url || '');

        // 태그
        const t1 = data.grade || data.year || '소속학년';
        const t2 = data.college || data.department || '소속대학';
        const t3 = data.trait || data.keyword || '성격';
        const t4 = data.mbti || 'MBTI';
        const list =
          Array.isArray(data.tags) && data.tags.length
            ? data.tags.slice(0, 4)
            : [t1, t2, t3, t4];
        setTags(list.filter(Boolean).slice(0, 4));

        // 요약
        setPoints(Number(data.points ?? data.point ?? 0));
        setParticipationCount(
          Number(data.participation_count ?? data.participated ?? 0)
        );
        setWarningCount(Number(data.warning_count ?? data.warnings ?? 0));
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
                src={avatarUrl || Vector}
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
              <p className="profile-name">{username}</p>
              <p className="profile-perinfo">{intro}</p>
            </div>
            <div className="profile-tags">
              {tags.map((t, i) => (
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
            <p>{Number(points).toLocaleString('ko-KR')}P</p>
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
              {participationCount}{' '}
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
              {warningCount}
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
            <li>로그아웃</li>
            <li className="delete_account">계정 탈퇴</li>
          </ul>
        </section>
      </div>
      <NavBar />
    </>
  );
}
