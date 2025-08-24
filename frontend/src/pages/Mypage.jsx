import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Mypage.css";
import Header from "../components/Header.jsx";
import NavBar from "../components/NavBar.jsx";

import Vector from "../assets/Vector.svg";
import Info from "../assets/info.svg";
import RigthBlack from "../assets/right_black.svg";

import LoginRequest from "../components/LoginRequest";
import api from "../api/axios";   // ✅ axios 인스턴스 가져오기

export default function Mypage() {
  const navigate = useNavigate();

  // 로그인 확인
  const token =
    localStorage.getItem("access") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access");
  const isLoggedIn = !!token;

  // userInfo: 처음에는 null → API 응답 오면 값 세팅
  const [userInfo, setUserInfo] = useState(null);

  // 툴팁 상태
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isWarningTooltipVisible, setIsWarningTooltipVisible] = useState(false);
  const onTooltipClick = () => setIsTooltipVisible((v) => !v);
  const onWarningTooltipClick = () => setIsWarningTooltipVisible((v) => !v);

  const handleParticipationClick = () => navigate("/mypage/history");

  // 로그아웃 함수
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  // 로그인 안 됐으면 모달
  if (!isLoggedIn) {
    return (
      <LoginRequest
        isOpen={true}
        onClose={() => navigate("/")}
        redirectTo="/mypage"
      />
    );
  }

  // 마운트 시 API 호출
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/mypage/main/");
        console.log("📌 /api/mypage/main/ Response:", res.data);

        const data = res.data;

        // MBTI 가공
        const mbtiObj = data.mbti || {};
        const mbtiString = [
          mbtiObj.i_e,
          mbtiObj.n_s,
          mbtiObj.f_t,
          mbtiObj.p_j,
        ]
          .filter(Boolean)
          .join("");

        setUserInfo({
          username: data.name ?? null,
          intro: data.intro ?? null,
          points: data.points ?? 0,
          avatarUrl: data.profile_image ?? null,
          tags: [
            data.grade ?? null,
            data.college ?? null,
            data.personality ?? null,
            mbtiString || null,
          ],
          participationCount: data.participation_count ?? 0,
          warningCount: data.warnings ?? 0,
        });
      } catch (e) {
        if (e.response) {
          console.error("❌ 서버 응답 에러:", e.response.status, e.response.data);
          if (e.response.status === 401) {
            navigate("/login");
          }
        } else if (e.request) {
          console.error("❌ 요청 보냈지만 응답 없음:", e.request);
        } else {
          console.error("❌ 요청 설정 중 에러:", e.message);
        }
      }
    })();
  }, [navigate]);

  return (
    <>
      <Header />
      <div className="profile-page">
        {!userInfo ? (
          <p>⏳ 불러오는 중...</p>
        ) : (
          <>
            {/* 프로필 */}
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
                  onClick={() => navigate("/mypage/edit")}
                >
                  수정하기
                </button>
              </div>
              <div className="profile-details">
                <div className="name-and-intro-container">
                  <p className="profile-name">
                    {userInfo.username || "이름 없음"}
                  </p>
                  <p className="profile-perinfo">
                    {userInfo.intro || "소개 없음"}
                  </p>
                </div>
                <div className="profile-tags">
                  {userInfo.tags.map((t, i) => (
                    <span className="profile-tag" key={i}>
                      {t || "정보 없음"}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* 포인트 */}
            <section className="point-section">
              <p>포인트</p>
              <div className="point-value-group">
                <p>{userInfo.points.toLocaleString("ko-KR")}P</p>
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

            {/* 참여 횟수/경고 */}
            <section className="profile-stats">
              <div className="stat-item" onClick={handleParticipationClick}>
                <p>참여횟수</p>
                <p className="stat-value">
                  {userInfo.participationCount}
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
                  <img
                    src={Info}
                    alt="info 이미지"
                    className="info-image-svg"
                  />
                </p>
                {isWarningTooltipVisible && (
                  <div className="tooltip warning-tooltip">
                    <p>경고는 서비스 이용 규칙을 위반했을 때 부여됩니다.</p>
                  </div>
                )}
              </div>
            </section>

            {/* 메뉴 */}
            <section className="profile-menu">
              <ul className="menu-list">
                <li>도움말</li>
                <li onClick={handleLogout} style={{ cursor: "pointer" }}>
                  로그아웃
                </li>
                <li className="delete_account">계정 탈퇴</li>
              </ul>
            </section>
          </>
        )}
      </div>
      <NavBar />
    </>
  );
}
