import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Back from '../assets/left_black.svg';
import Partici_profile from '../assets/partici_profile.svg';
import './participants.css';
import api from '../api/axios';

export default function Participants() {
  const navigate = useNavigate();
  const { partyId } = useParams(); // URL에서 파티 ID 가져오기
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // 현재 로그인한 사용자 ID 가져오기
  useEffect(() => {
    // 로컬 스토리지나 상태 관리 라이브러리에서 사용자 정보 가져오기
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
      } catch (e) {
        console.error("사용자 정보 파싱 오류:", e);
      }
    }
  }, []);

  // 참여자 목록 가져오기
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!partyId) {
        setError("파티 ID가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/api/partyassist/standby/${partyId}/participants/`);
        setParticipants(response.data);
        setLoading(false);
      } catch (err) {
        console.error("참여자 목록 로드 실패:", err);
        setError("참여자 정보를 불러오는데 실패했습니다.");
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [partyId]);

  // 유저의 추가 설정에서 태그 정보 추출
  const extractTags = (extraSetting) => {
    if (!extraSetting) return [];
    try {
      // extra_setting이 문자열로 왔을 경우 파싱
      const extraData = typeof extraSetting === 'string' 
        ? JSON.parse(extraSetting) 
        : extraSetting;

      // extra 객체 안에 태그 정보가 있음
      const extra = extraData.extra || {};
      const tags = [];
      // 각 태그 정보가 있으면 배열에 추가
      if (extra.grade) tags.push(extra.grade);
      if (extra.college) tags.push(extra.college);
      if (extra.personality) tags.push(extra.personality);
      // MBTI 정보 처리
      if (extra.mbti) {
        const mbti = extra.mbti;
        if (typeof mbti === 'object') {
          // MBTI 객체가 i_e, n_s, f_t, p_j 형식으로 왔을 경우
          const mbtiString = 
            (mbti.i_e || '') + 
            (mbti.n_s || '') + 
            (mbti.f_t || '') + 
            (mbti.p_j || '');

          if (mbtiString) tags.push(mbtiString);
        } else if (typeof mbti === 'string') {
          // MBTI가 문자열로 왔을 경우
          tags.push(mbti);
        }
      }
      return tags;
    } catch (e) {
      console.error("태그 파싱 오류:", e);
      return [];
    }
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="participants-loading">
        <div className="loading-spinner"></div>
        <p>참여자 정보를 불러오는 중...</p>
      </div>
    );
  }

  // 에러 표시
  if (error) {
    return (
      <div className="participants-error">
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>뒤로 가기</button>
      </div>
    );
  }

  return (
    <>
      <button className="participants-back-btn" onClick={() => navigate(-1)}>
        <img src={Back} alt="뒤로가기" />
      </button>
      <div className='participants-spaceExpansion-top'></div>
      <div className="participants-list">
        {participants.map((participant) => {
          const user = participant.user;
          const tags = extractTags(user.extra_setting);
          const isCurrentUser = user.id === currentUserId;

          return (
            <div className="participant-block" key={participant.id}>
              <div className="participant-profile-col">
                <img 
                  src={user.profile_image || Partici_profile} 
                  alt="프로필" 
                  className="participant-profile-img" 
                />
                {!isCurrentUser ? (
                  <button
                    className="participant-report-btn"
                    onClick={() => navigate(`/report/${user.id}`, { 
                      state: { 
                        user: {
                          id: user.id,
                          name: user.username,
                          photo: user.profile_image,
                          partyId: partyId
                        } 
                      } 
                    })}
                  >
                    신고하기
                  </button>
                ) : (
                  <button
                    className="participant-report-btn participant-report-disabled"
                    onClick={() => alert("본인은 신고할 수 없습니다.")}
                    disabled
                  >
                    신고 불가
                  </button>
                )}
              </div>
              <div className="participant-info">
                <div className="participant-name">{user.username}</div>
                <div className="participant-message">
                  {user.intro || "소개 메시지가 없습니다."}
                </div>
                <div className="participant-tags">
                  {tags.length > 0 ? (
                    tags.map((tag, i) => (
                      <span className="participant-tag" key={i}>{tag}</span>
                    ))
                  ) : (
                    <span className="participant-tag participant-tag-empty">태그 정보 없음</span>
                  )}
                </div>
                {participant.is_standby && (
                  <div className="participant-standby">준비 완료</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className='participants-spaceExpansion'></div>
    </>
  );
}

