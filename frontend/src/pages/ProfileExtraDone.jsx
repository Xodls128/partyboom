import { useNavigate} from 'react-router-dom';
import './ProfileExtraDone.css';

import LeftIcon from '../assets/left_black.svg';
import CheckIcon from '../assets/check_circle.svg';

export default function ProfileExtraDone() {
  const nav = useNavigate();
  const goConfirm = () => {
    // 완료 후 마이페이지로
    nav('/mypage', { replace: true });
  };

  return (
    <div className="done-page">
      <header className="done-top">
        <button type="button" className="done-back" onClick={() => nav(-1)} aria-label="뒤로가기">
          <img src={LeftIcon} alt="" />
        </button>
      </header>

      <main className="done-center">
        <img src={CheckIcon} alt="" className="done-check" />
        <p className="done-title">프로필 세팅 완료!</p>
      </main>

      <div className="done-actions">
        <button type="button" className="done-btn" onClick={goConfirm}>확인</button>
      </div>
    </div>
  );
}
