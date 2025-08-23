import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileEdit.css';
import LeftIcon from '../assets/left_black.svg';
import CameraIcon from '../assets/camera.svg';
import EditIcon from '../assets/edit.svg';

const API_BASE = import.meta.env.VITE_API_URL
const PROFILE_URL = `${API_BASE}/api/mypage/profile/`;
const AUTH_SCHEME = 'Bearer';

const getToken = () =>
  localStorage.getItem('access') ||
  localStorage.getItem('accessToken') ||
  localStorage.getItem('token') ||
  sessionStorage.getItem('access') ||
  (() => {
    try {
      const pick = (k) => {
        const raw = localStorage.getItem(k);
        if (!raw) return null;
        const o = JSON.parse(raw);
        return o?.access || o?.token || o?.access_token || null;
      };
      return pick('auth') || pick('user') || '';
    } catch { return ''; }
  })();

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
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      setPhotoUrl(URL.createObjectURL(f));
      setPhotoFile(f);
    }
  };

  // 최초 로드: 내 정보 불러오기
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) return;

      try {
        const res = await fetch(PROFILE_URL, {
          headers: {
            Authorization: `${AUTH_SCHEME} ${token}`,
            Accept: 'application/json',
          },
        });
        if (!res.ok) return;
        const me = await res.json();

        setValues((s) => ({
          ...s,
          intro: me.intro ?? me.bio ?? s.intro,
        }));

        const existing = me.profile_image || me.avatar_url || me.photo_url;
        if (existing) setPhotoUrl(existing);
      } catch (e) {
        console.warn('프로필 로드 오류:', e);
      }
    })();

    return () => { if (photoUrl?.startsWith('blob:')) URL.revokeObjectURL(photoUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    const token = getToken();
    if (!token) {
      alert('로그인이 필요합니다.');
      return nav('/login');
    }
    if (values.pw || values.pw2) {
      if (values.pw.length < 8) return alert('비밀번호는 8자 이상 입력해 주세요.');
      if (values.pw !== values.pw2) return alert('새 비밀번호가 일치하지 않습니다.');
    }

    setSaving(true);

    try {
      // 1) 비밀번호 변경 (입력한 경우)
      if (values.pw) {
        const pwdRes = await fetch(PROFILE_URL, {
          method: 'POST',
          headers: {
            Authorization: `${AUTH_SCHEME} ${token}`,
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

      const profRes = await fetch(PROFILE_URL, {
        method: 'PATCH',
        headers: {
          Authorization: `${AUTH_SCHEME} ${token}`,
          Accept: 'application/json',
          // ⚠️ FormData일 땐 Content-Type 넣지 않기
        },
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
