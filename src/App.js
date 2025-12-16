import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import RecentTournaments from "./pages/RecentTournaments";
import CreateOfficial from "./pages/CreateOfficial";
import TournamentDetail from "./pages/TournamentDetail";
import WinnerPage from "./pages/WinnerPage";
import DrawPage from "./pages/DrawPage";

export default function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        {/* Redirections pour éviter page blanche */}
        <Route path="/" element={<Navigate to="/recent" replace />} />

        <Route path="/recent" element={<RecentTournaments />} />
        <Route path="/create" element={<CreateOfficial />} />
        <Route path="/tournament/:id" element={<TournamentDetail />} />
        <Route path="/winner/:id" element={<WinnerPage />} />
        <Route path="/draw" element={<DrawPage />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/recent" replace />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
