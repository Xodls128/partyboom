// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';

// (선택) 혹시 index.html에 뷰포트 메타가 없을 때 보완
(function ensureViewport() {
  const want = 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1';
  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    document.head.appendChild(meta);
  }
  if (meta.content !== want) meta.setAttribute('content', want);
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

// 프로덕션에서만 서비스워커 등록
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // (선택) 새 버전 배포 시 갱신 감지
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            // if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            //   // 새 컨텐츠가 준비됨 → 토스트/모달로 알리고 필요 시 새로고침
            //   // window.location.reload();
            // }
          });
        });
      })
      .catch(console.error);
  });
}