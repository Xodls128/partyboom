import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
// import Notifications from "./pages/Notifications.jsx";
import Map from "./pages/Map.jsx";
// import Assist from "./pages/Assist.jsx";
// import Mypage from "./pages/Mypage.jsx";  {/*페이지의 파일명, 경로명 일치시키기 */}
import AppFrame from './components/AppFrame.jsx';
import KakaoLoginPage from "./pages/KakaoLoginPage.jsx";
import KakaoCallbackPage from "./pages/KakaoCallbackPage.jsx";
import Login from './pages/Login.jsx';
import Signup from './pages/SignUp.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AppFrame>
        <Routes>
          <Route index element={<Home />} />
          {/* <Route path="/notifications" element={<Notifications />} /> */}
          <Route path="/map" element={<Map />} />
          {/* <Route path="/assist" element={<Assist />} />
          <Route path="/mypage" element={<Mypage />} /> */}
          <Route path="/kakao-login" element={<KakaoLoginPage />} />
          <Route path="/oauth/kakao/callback" element={<KakaoCallbackPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </AppFrame>
    </BrowserRouter>
  );
}


