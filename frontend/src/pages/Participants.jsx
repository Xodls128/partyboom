import { useNavigate } from 'react-router-dom';
import Back from '../assets/left_black.svg';
import Partici_profile from '../assets/partici_profile.svg';
import './participants.css';

export default function Participants() {
  const navigate = useNavigate();

  // 임시 데이터 예시
  const participants = Array(5).fill({
    id: 1, // id 추가
    name: '김00',
    message: '파티붐 화이팅! 다들 반가워요!',
    tags: ['1학년', '사회과학대학', '활발한', 'ENFP'],
  });

  return (
    <>
      <button className="participants-back-btn" onClick={() => navigate(-1)}>
        <img src={Back} alt="뒤로가기" />
      </button>
      <div className='participants-spaceExpansion-top'></div>
      <div className="participants-list">
        {participants.map((user, idx) => (
          <div className="participant-block" key={idx}>
            <div className="participant-profile-col">
              <img src={Partici_profile} alt="프로필" className="participant-profile-img" />
              <button
                className="participant-report-btn"
                onClick={() => navigate(`/report/${user.id}`, { state: { user } })}
              >
                신고하기
              </button>
            </div>
            <div className="participant-info">
              <div className="participant-name">{user.name}</div>
              <div className="participant-message">{user.message}</div>
              <div className="participant-tags">
                {user.tags.map((tag, i) => (
                  <span className="participant-tag" key={i}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className='participants-spaceExpansion'></div>
    </>
  );
}
