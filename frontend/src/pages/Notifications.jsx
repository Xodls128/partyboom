import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Back from '../assets/left_black.svg';
import './notifications.css';
import api from '../api/axios';
import LoginRequest from '../components/LoginRequest'; // LoginRequest 컴포넌트 import

export default function Notifications() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoginAndFetch = async () => {
      const token = localStorage.getItem("access");
      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }
      
      setIsLoggedIn(true);
      try {
        const response = await api.get("/api/notice/");
        setNotices(response.data);
      } catch (error) {
        console.error("알림 데이터를 불러오는 중 오류 발생:", error);
        // 401 에러 발생 시 로그아웃 처리도 가능
        if (error.response?.status === 401) {
          setIsLoggedIn(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkLoginAndFetch();
  }, []);

  // handleNoticeClick 함수 수정
  const handleNoticeClick = async (noticeId) => {
    const notice = notices.find(n => n.id === noticeId);
    if (notice && notice.is_read) return;

    try {
      await api.patch(`/api/notice/${noticeId}/`, { is_read: true });
      
      // 알림 목록 업데이트
      setNotices((prevNotices) =>
        prevNotices.map((n) =>
          n.id === noticeId ? { ...n, is_read: true } : n
        )
      );
      
      // 모든 알림이 읽혔는지 확인
      const updatedNotices = notices.map((n) =>
        n.id === noticeId ? { ...n, is_read: true } : n
      );
      const allRead = updatedNotices.every(notice => notice.is_read);
      
      // 모든 알림이 읽혀진 경우, Header 컴포넌트에 알림
      if (allRead) {
        // 커스텀 이벤트를 발생시켜 Header 컴포넌트에 알림
        window.dispatchEvent(new Event('notificationUpdate'));
      }
    } catch (error) {
      console.error("알림 읽음 처리 중 오류 발생:", error);
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  // --- 로그인 안된 경우 LoginRequest 렌더링 ---
  if (!isLoggedIn) {
    return (
      <LoginRequest 
        isOpen={true} 
        onClose={() => navigate('/')} 
        redirectTo="/notifications"   // 로그인 후 다시 돌아올 경로
      />
    );
  }

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

      {notices.length === 0 ? (
        <div className="notification-empty">새 알림이 없습니다.</div>
      ) : (
        notices.map((notice) => (
          <div
            key={notice.id}
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
      )}

      <div className="spaceExpansion"></div>
    </>
  );
}
