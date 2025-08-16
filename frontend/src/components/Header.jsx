import { useNavigate } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="header">
      <button
        type="button"
        className="bell-button"
        aria-label="알림"
        onClick={() => navigate('/notifications')}
      />
    </header>
  );
}
