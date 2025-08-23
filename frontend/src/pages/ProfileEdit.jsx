import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileEdit.css';
import LeftIcon from '../assets/left_black.svg';
import CameraIcon from '../assets/camera.svg';
import EditIcon from '../assets/edit.svg';

const API_BASE = import.meta.env.VITE_API_URL;

export default function ProfileEdit() {
  const nav = useNavigate();
  const fileRef = useRef(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // 사용자 입력 값 
  const [values, setValues] = useState({
    pw: '',
    pw2: '',
    intro: '',
  });

  const onChange = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  const pickPhoto = () => fileRef.current?.click();
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      // 미리보기 갱신
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      setPhotoUrl(URL.createObjectURL(f));
      setPhotoFile(f);
    }
  };

  // 최초 로드: 내 정보 불러오기 (홈 패턴과 동일)
  useEffect(() => {
    const token = localStorage.getItem('access');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/mypage/profile/`, { headers });
        if (!res.ok) return;
        const me = await res.json();
        // 서버 필드명 대응: intro/bio
        setValues((s) => ({
          ...s,
          intro: me.intro ?? me.bio ?? s.intro,
        }));
        // 기존 프로필 이미지가 있으면 미리보기 설정
        const existing = me.profile_image || me.avatar_url || me.photo_url;
        if (existing) setPhotoUrl(existing);
      } catch (e) {
        console.warn('프로필 로드 오류:', e);
      }
    })();

    // 미리보기 URL 정리
    return () => { if (photoUrl?.startsWith('blob:')) URL.revokeObjectURL(photoUrl); };
  }, []);

  const save = async () => {
    const token = localStorage.getItem('access');
    if (!token) {
      alert('로그인이 필요합니다.');
      return nav('/login');
    }
    if (values.pw || values.pw2) {
      if (values.pw.length < 8) return alert('비밀번호는 8자 이상 입력해 주세요.');
      if (values.pw !== values.pw2) return alert('새 비밀번호가 일치하지 않습니다.');
    }

    setSaving(true);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1) 비밀번호 변경 (입력한 경우)
      if (values.pw) {
        const pwdRes = await fetch(`${API_BASE}/api/mypage/profile/`, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            new_password: values.pw,
            new_password2: values.pw2,
          }),
        });
        if (!pwdRes.ok) {
          const msg = await safeText(pwdRes);
          throw new Error(`비밀번호 변경 실패: ${msg || `HTTP ${pwdRes.status}`}`);
        }
      }

      // 2) 프로필(한줄소개/이미지) 변경
      const fd = new FormData();
      fd.append('intro', values.intro);
      if (photoFile) fd.append('profile_image', photoFile); // 서버 필드명에 맞춰 사용

      // FormData 전송 시 Content-Type 명시 금지 (브라우저가 boundary 자동 설정)
      const profRes = await fetch(`${API_BASE}/api/mypage/profile/`, {
        method: 'PATCH',
        headers,
        body: fd,
      });
      if (!profRes.ok) {
        const msg = await safeText(profRes);
        throw new Error(`프로필 저장 실패: ${msg || `HTTP ${profRes.status}`}`);
      }

      alert('저장 완료!');
      nav(-1);
    } catch (e) {
      console.error(e);
      alert(e.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pe-page">
      <header className="pe-top">
        <button type="button" className="pe-back" onClick={() => nav(-1)} aria-label="뒤로가기">
          <img src={LeftIcon} alt="" />
        </button>
      </header>

      {/* 프로필 사진 */}
      <section className="pe-photo" onClick={pickPhoto} role="button" aria-label="프로필 사진 변경">
        {photoUrl ? (
          <img src={photoUrl} alt="프로필 미리보기" className="pe-photo-img" />
        ) : (
          <img src={CameraIcon} alt="" className="pe-photo-ic" />
        )}
        <input
          ref={fileRef}
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={onFile}
        />
      </section>

      {/* 입력 */}
      <div className="pe-form">
        <div className="pe-field">
          <label>비밀번호 수정</label>
          <div className="pe-input">
            <input
              type="password"                
              autoComplete="new-password"
              value={values.pw}
              onChange={(e) => onChange('pw', e.target.value)}
              placeholder="  새 비밀번호를 입력하세요"
            />
            <span className="pe-trailing-ic" aria-hidden="true">
              <img src={EditIcon} alt="" />
            </span>
          </div>
        </div>

        <div className="pe-field">
          <label>새 비밀번호 확인</label>
          <div className="pe-input">
            <input
              type="password"                
              autoComplete="new-password"
              value={values.pw2}
              onChange={(e) => onChange('pw2', e.target.value)}
              placeholder="  비밀번호를 한 번 더 입력하세요"
            />
            <span className="pe-trailing-ic" aria-hidden="true">
              <img src={EditIcon} alt="" />
            </span>
          </div>
        </div>

        <div className="pe-field">
          <label>한줄소개</label>
          <div className="pe-input">
            <input
              type="text"
              value={values.intro}
              onChange={(e) => onChange('intro', e.target.value)}
              placeholder="  자기소개를 입력하세요"
            />
            <span className="pe-trailing-ic" aria-hidden="true">
              <img src={EditIcon} alt="" />
            </span>
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="pe-actions">
        <button
          type="button"
          className="pe-btn pe-btn--save"
          onClick={save}
          disabled={saving}
        >
          저장
        </button>
        <button
          type="button"
          className="pe-btn pe-btn--more"
          onClick={() => nav('/mypage/extra')}
          disabled={saving}
        >
          추가정보 입력하기→
        </button>
      </div>
    </div>
  );
}

// 응답 본문을 안전하게 텍스트로 추출 (에러 메시지 표시용)
async function safeText(res) {
  try {
    const t = await res.text();
    return t && t.length ? t : '';
  } catch {
    return '';
  }
}
