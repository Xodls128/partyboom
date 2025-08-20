import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Notifications from "./pages/Notifications.jsx";
import Map from "./pages/Map.jsx";
import Assist from "./pages/Assist.jsx";
import Mypage from "./pages/Mypage.jsx";  
import AppFrame from './components/AppFrame.jsx';
import ReportUser from './pages/ReportUser.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AppFrame>
        <Routes>
          <Route index element={<Home />} /> 
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/map" element={<Map />} />
          <Route path="/assist" element={<Assist />} />
          <Route path="/mypage" element={<Mypage />} />
          <Route path="/report/:userId" element={<ReportUser />} /> 
        </Routes>
      </AppFrame>
    </BrowserRouter>
  );
}
