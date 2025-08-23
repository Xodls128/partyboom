import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import Partyinfo from './pages/Partyinfo.jsx';
import Notifications from "./pages/Notifications.jsx";
import Map from "./pages/Map.jsx";
// import Assist from "./pages/Assist.jsx";
import Mypage from "./pages/Mypage.jsx";  {/*페이지의 파일명, 경로명 일치시키기 */}
import AppFrame from './components/AppFrame.jsx';
import KakaoLoginPage from "./pages/KakaoLoginPage.jsx";
import KakaoCallbackPage from "./pages/KakaoCallbackPage.jsx";
import Login from './pages/Login.jsx';
import Signup from './pages/SignUp.jsx';
import Payment from './pages/Payment.jsx';
import Balancewait from './pages/Balancewait.jsx';
import Balancegame from "./pages/Balancegame.jsx";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 앱 시작 시 localStorage에서 토큰 확인
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);
  
  return (
    <BrowserRouter>
      <AppFrame>
        <Routes>
          <Route index element={<Home />} />
          <Route 
            path="/notifications" 
            element={
              isLoggedIn ? <Notifications /> : <KakaoLoginPage />
            } 
          />
          {/* <Route path="/assist" element={<Assist />} /> */}
          <Route path="/mypage" element={<Mypage />} />
          <Route path="/map" element={<Map />} />
          <Route path="/partyinfo/:partyId" element={<Partyinfo />} />
          <Route path="/kakao-login" element={<KakaoLoginPage />} />
          <Route path="/oauth/kakao/callback" element={<KakaoCallbackPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/balancewait/:partyId" element={<Balancewait />} />
          <Route path="/balancegame/:partyId" element={<Balancegame />} />
        </Routes>
      </AppFrame>
    </BrowserRouter>
  );
}