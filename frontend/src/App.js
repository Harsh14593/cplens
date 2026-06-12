import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PublicProfile from "./pages/PublicProfile";
import Compare from "./pages/Compare";
import Leaderboard from "./pages/Leaderboard";
import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/u"           element={<PublicProfile />} />
          <Route path="/compare"     element={<Compare />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
