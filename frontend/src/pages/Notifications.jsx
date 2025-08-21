import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Back from '../assets/left_black.svg';
import './notifications.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function Notifications() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        setShowLoginPopup(true);
        return;
      }

      // 1. API 엔드포인트를 DB 기반 알림을 가져오도록 변경
      const response = await fetch(
        `${API_BASE}/api/notice/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        setShowLoginPopup(true);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      setNotices(data);
    } catch (error) {
      console.error("알림 데이터를 불러오는 중 오류 발생:", error);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // 2. 알림 읽음 처리 함수 추가
  const handleNoticeClick = async (noticeId) => {
    // 이미 읽은 알림은 다시 처리하지 않음
    const notice = notices.find(n => n.id === noticeId);
    if (notice && notice.is_read) {
      return;
    }

    try {
      const token = localStorage.getItem("access");
      await fetch(`${API_BASE}/api/notice/${noticeId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_read: true }),
      });

      // 3. UI에서 즉시 '읽음' 상태로 업데이트
      setNotices((prevNotices) =>
        prevNotices.map((n) =>
          n.id === noticeId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error("알림 읽음 처리 중 오류 발생:", error);
    }
  };

  return (
    <>
      <div className="notifications-header">
        <button
          onClick={() => navigate(-1)}
          className="back-button"
          aria-label="뒤로가기"
        >
          <img src={Back} alt="뒤로가기 아이콘" className="back-icon" />
        </button>
        <span className="notifications-title">알림</span>
      </div>

      {showLoginPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>파티 알림은 로그인 후 확인하실 수 있습니다.</p>
            <div className="popup-actions">
              <button
                className="login-btn"
                onClick={() => navigate("/kakao-login")}
              >
                로그인하기
              </button>
              <button
                className="back-btn"
                onClick={() => navigate("/")}
              >
                뒤로가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 새로운 데이터 구조에 맞게 알림 목록 UI 수정 */}
      {!showLoginPopup &&
        (notices.length === 0 ? (
          <div className="notification-empty">새 알림이 없습니다.</div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              // 5. 읽음/안읽음 상태에 따라 클래스 부여 및 클릭 이벤트 추가
              className={`notification-block ${notice.is_read ? 'read' : 'unread'}`}
              onClick={() => handleNoticeClick(notice.id)}
            >
              <div className="notifications-content">
                <div>{notice.message}</div>
              </div>
              <div className="notifications-day">
                <div>
                  {new Date(notice.created_at).toLocaleString("ko-KR", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div className="notification-divider"></div>
            </div>
          ))
        ))}

      <div className="spaceExpansion"></div>
    </>
  );
}
