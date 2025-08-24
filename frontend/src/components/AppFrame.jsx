import { useEffect } from 'react';
import './appframe.css';

export default function AppFrame({ children }) {
  useEffect(() => {
    const apply = () => {
      const isMobileByWidth = window.matchMedia('(max-width: 820px)').matches;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobile = isMobileByWidth || isTouch;
      document.documentElement.classList.toggle('mobile', isMobile);
    };
    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    return () => {
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
    };
  }, []);

  return (
    <div className="viewport-lock">
      <div className="phone">
        <div className="app-scroll">
          {children}
        </div>
      </div>
    </div>
  );
}