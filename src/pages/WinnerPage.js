import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import "./WinnerPage.css";

export default function WinnerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/tournaments/${id}`);
        setWinner(res.data?.knockout?.winner || null);
      } catch (e) {
        console.error(e);
        setWinner(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page page--center">
      <div className="card winnerCard">
        <h1 className="winnerTitle">🏆 Vainqueur</h1>

        <div className="winnerName">
          {winner || "Pas de vainqueur pour l’instant"}
        </div>

        <button className="btn btn--primary" onClick={() => navigate("/")}>
          Retour Home
        </button>
      </div>
    </div>
  );
}
