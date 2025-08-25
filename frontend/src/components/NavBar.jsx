//css 파일 따로 없이 JSX에서 스타일 적용
import { useNavigate, useLocation } from 'react-router-dom';

import bgHome   from '../assets/nav_home.svg?url';
import bgMap    from '../assets/nav_map.svg?url';
import bgAssist from '../assets/nav_assist.svg?url';
import bgMy     from '../assets/nav_mypage.svg?url';

export default function NavBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const bg = (() => {
    if (pathname === '/' || pathname === '/home') return bgHome;
    if (pathname.startsWith('/map')) return bgMap;
    if (pathname.startsWith('/assist') || pathname.startsWith('/balancewait')) return bgAssist;
    if (pathname.startsWith('/mypage')) return bgMy;
    return bgHome;
  })();

  return (
    <div className="footer-wrap" style={{
      width: '393px',
      height: '85px',
      position: 'absolute', // fixed → absolute
      left: 0,
      bottom: 0,
      boxShadow: '0 -4px 6px rgba(0,0,0,0.1)',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      borderRadius: '0 0 16px 16px',
      background: '#fff',
      overflow: 'hidden',
    }}>
      <img
        src={bg}
        alt="nav background"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '393px',
          height: '101px',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
      }}>
        <button
          type="button"
          className="nav-link"
          aria-label="홈"
          onClick={() => navigate('/')}
          style={{ background: 'transparent', border: 'none' }}
        />
        <button
          type="button"
          className="nav-link"
          aria-label="지도"
          onClick={() => navigate('/map')}
          style={{ background: 'transparent', border: 'none' }}
        />
        <button
          type="button"
          className="nav-link"
          aria-label="파티보조"
          onClick={() => navigate('/assist')}
          style={{ background: 'transparent', border: 'none' }}
        />
        <button
          type="button"
          className="nav-link"
          aria-label="마이페이지"
          onClick={() => navigate('/mypage')}
          style={{ background: 'transparent', border: 'none' }}
        />
      </div>
    </div>
  );
}
