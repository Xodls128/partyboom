import './appframe.css';

export default function AppFrame({ children }) {
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

