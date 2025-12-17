import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import RecentTournaments from "./pages/RecentTournaments";
import CreateOfficial from "./pages/CreateOfficial";
import DrawPage from "./pages/DrawPage";
import TournamentDetail from "./pages/TournamentDetail";
import WinnerPage from "./pages/WinnerPage";
import Wtf from "./pages/Wtf";

export default function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recent" element={<RecentTournaments />} />
        <Route path="/create" element={<CreateOfficial />} />
        <Route path="/draw" element={<DrawPage />} />
        <Route path="/tournament/:id" element={<TournamentDetail />} />
        <Route path="/winner/:id" element={<WinnerPage />} />
        <Route path="/wtf" element={<Wtf />} />
        <Route path="*" element={<Navigate to="/recent" replace />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
