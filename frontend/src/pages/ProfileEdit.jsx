import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileEdit.css';

import LeftIcon from '../assets/left_black.svg';
import CameraIcon from '../assets/camera.svg';
import EditIcon from '../assets/edit.svg';

export default function ProfileEdit() {
  const nav = useNavigate();
  const fileRef = useRef(null);
  const [photoUrl, setPhotoUrl] = useState(null);

  // 사용자 입력 값 
  const [values, setValues] = useState({
    pw: '',
    pw2: '',
    intro: '파티붐 화이팅! 다들 반가워요!',
  });

  const onChange = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  const pickPhoto = () => fileRef.current?.click();
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setPhotoUrl(URL.createObjectURL(f));
  };

  const save = () => {
    if (values.pw || values.pw2) {
      if (values.pw.length < 8) return alert('비밀번호는 8자 이상 입력해 주세요.');
      if (values.pw !== values.pw2) return alert('새 비밀번호가 일치하지 않습니다.');
    }
    //저장 API 호출
    alert('저장 완료!');
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
        <button type="button" className="pe-btn pe-btn--save" onClick={save}>저장</button>
        <button type="button" className="pe-btn pe-btn--more" onClick={() => nav('/mypage/extra')}>추가정보 입력하기→</button>
      </div>
    </div>
  );
}
