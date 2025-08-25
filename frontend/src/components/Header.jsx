import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './header.css';
import api from '../api/axios';

export default function Header() {
  const navigate = useNavigate();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // 읽지 않은 알림이 있는지 확인
  useEffect(() => {
    const checkUnreadNotifications = async () => {
      const token = localStorage.getItem("access");
      if (!token) return; // 로그인 되어 있지 않으면 확인하지 않음

      try {
        const response = await api.get("/api/notice/");
        // 읽지 않은 알림이 하나라도 있는지 확인
        const hasUnread = response.data.some(notice => !notice.is_read);
        setHasUnreadNotifications(hasUnread);
      } catch (error) {
        console.error("알림 상태 확인 중 오류 발생:", error);
      }
    };

    // 컴포넌트 마운트 시 확인
    checkUnreadNotifications();

    // 5분마다 알림 상태 업데이트 (선택사항)
    const intervalId = setInterval(checkUnreadNotifications, 300000);
    
    // 알림 상태 변경을 위한 이벤트 리스너
    const handleNotificationUpdate = () => {
      checkUnreadNotifications();
    };
    
    // 이벤트 리스너 등록
    window.addEventListener('notificationUpdate', handleNotificationUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, []);

  return (
    <header className="header">
      <button
        type="button"
        className="bell-button"
        aria-label="알림"
        onClick={() => navigate('/notifications')}
      >
        {hasUnreadNotifications && <span className="notification-badge"></span>}
      </button>
    </header>
  );
}
