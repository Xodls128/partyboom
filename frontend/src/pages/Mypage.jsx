import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Mypage.css';
import Header from '../components/Header.jsx';
import NavBar from '../components/NavBar.jsx';

import Vector from '../assets/Vector.svg';
import Info from '../assets/info.svg';
import RigthBlack from '../assets/right_black.svg';

const API_BASE = import.meta.env.VITE_API_URL;

export default function Mypage() {
  const navigate = useNavigate();

  // ── 홈 패턴과 동일: 상태들 선언
  const [username, setUsername] = useState('게스트');
  const [intro, setIntro] = useState('한 줄 소개를 작성해주세요');
  const [tags, setTags] = useState(['소속학년', '소속대학', '성격', 'MBTI']);
  const [points, setPoints] = useState(0);
  const [participationCount, setParticipationCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');

  // 포인트 툴팁
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const onTooltipClick = () => { setIsTooltipVisible(!isTooltipVisible); };

  // 경고 툴팁
  const [isWarningTooltipVisible, setIsWarningTooltipVisible] = useState(false);
  const onWarningTooltipClick = () => { setIsWarningTooltipVisible(!isWarningTooltipVisible); };

  const handleParticipationClick = () => { navigate('/mypage/history'); };

  // ── 홈 패턴과 동일: 마운트 시 유저/요약 데이터 로드
  useEffect(() => {
    const token = localStorage.getItem('access');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    // 1) 프로필(닉네임/자기소개/태그/아바타) 불러오기
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/mypage/main/`, { headers });
        if (!res.ok) return; // 토큰 없거나 게스트면 그대로 둠
        const data = await res.json();

        setUsername(data.nickname || data.username || '게스트');
        setIntro(data.intro || data.bio || '');
        setAvatarUrl(data.profile_image || data.avatar_url || '');

        // 태그: 서버 포맷이 다양할 수 있으니 안전하게 생성
        const t1 = data.grade || data.year || '소속학년';
        const t2 = data.college || data.department || '소속대학';
        const t3 = data.trait || data.keyword || '성격';
        const t4 = data.mbti || 'MBTI';
        const list = Array.isArray(data.tags) && data.tags.length > 0
          ? data.tags.slice(0, 4)
          : [t1, t2, t3, t4];
        setTags(list.filter(Boolean).slice(0, 4));
      } catch (e) {
        // 콘솔만 찍고 UI는 기본값 유지
        console.error('유저 정보를 불러오는 중 오류:', e);
      }
    };

    // 2) 마이페이지 요약(포인트/참여횟수/경고수) 불러오기
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/mypage/main/`, { headers });
        if (!res.ok) return;
        const s = await res.json();
        setPoints(Number(s.points ?? s.point ?? 0));
        setParticipationCount(Number(s.participation_count ?? s.participated ?? 0));
        setWarningCount(Number(s.warning_count ?? s.warnings ?? 0));
      } catch (e) {
        console.warn('요약 정보 불러오는 중 오류:', e);
      }
    };

    fetchUser();
    fetchSummary();
  }, []);

  // 로그아웃/탈퇴 (li 클릭에만 연결, className 변경 없음)
  // const handleLogout = async () => {
  //   const token = localStorage.getItem('access');
  //   const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  //   try {
  //     // 백엔드에 맞춰 조정 (예: POST /api/auth/logout/)
  //     await fetch(`${API_BASE}/api/auth/logout/`, { method: 'POST', headers });
  //   } catch (_) {
  //     // 엔드포인트 없으면 토큰만 지우고 이동
  //   } finally {
  //     localStorage.removeItem('access');
  //     navigate('/login');
  //   }
  // };

  // const handleDeleteAccount = async () => {
  //   if (!confirm('정말 계정을 탈퇴하시겠어요? 이 작업은 되돌릴 수 없습니다.')) return;
  //   const token = localStorage.getItem('access');
  //   const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  //   try {
  //     // 백엔드에 맞춰 조정 (예: DELETE /api/user/me/)
  //     const res = await fetch(`${API_BASE}/api/user/me/`, { method: 'DELETE', headers });
  //     if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  //     alert('계정이 탈퇴되었습니다.');
  //     localStorage.removeItem('access');
  //     navigate('/signup');
  //   } catch (e) {
  //     alert('탈퇴 처리 중 오류가 발생했습니다.');
  //     console.error(e);
  //   }
  // };

  return (
    <>
      <Header/>
      <div className="profile-page">
        {/* 1. 프로필 정보 섹션: 프로필 사진, 이름, 한 줄 소개, 태그 */}
        <section className="profile-info">
          <div className="profile-photo-group">
            <div className="profile-image-wrap">
              <img
                src={avatarUrl || Vector}
                alt="프로필 이미지"
                className="profile-image-svg"
              />
            </div>
            <button className="edit-button" onClick={() => navigate('/mypage/edit')}>
              수정하기
            </button>
          </div>

          <div className="profile-details">
            <div className='name-and-intro-container'>
              <p className="profile-name">{username}</p>
              <p className="profile-perinfo">{intro}</p>
            </div>
            <div className="profile-tags">
              {tags.map((t, i) => (
                <span className="profile-tag" key={i}>{t}</span>
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
              <p>포인트는 파티붐 서비스 활동을 통해<br />획득하거나 사용할 수 있는 재화입니다.</p>
            </div>
          )}
        </section>

        {/* 3. 참여 횟수 및 경고 섹션 */}
        <section className="profile-stats">
          <div className="stat-item" onClick={handleParticipationClick}>
            <p>참여횟수</p>
            <p className='stat-value'>
              {participationCount} <img src={RigthBlack} alt="right 이미지" className="right-image-svg"/>
            </p>
          </div>
          <div className="stat-item">
            <p>경고</p>
            <p className='stat-value' onClick={onWarningTooltipClick}>
              {warningCount}
              <img src={Info} alt="info 이미지" className="info-image-svg"/>
            </p>
            {isWarningTooltipVisible && (
              <div className="tooltip warning-tooltip">
                <p>경고는 서비스 이용 규칙을 위반했을 때 부여됩니다.</p>
              </div>
            )}
          </div>
        </section>

        {/* 4. 설정 메뉴 목록 섹션 */}
         <section className="profile-menu">
          <ul className="menu-list">
            <li>도움말</li>
            <li>로그아웃</li>
            <li className='delete_account'>계정 탈퇴</li>
          </ul>
        </section>
      </div>
      <NavBar/>
    </>
  );
}
