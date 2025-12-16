import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

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

  if (loading) return <div style={{ padding: 16 }}>Chargement...</div>;

  return (
    <div style={{ padding: 16, textAlign: "center" }}>
      <h1>🏆 Vainqueur</h1>
      <div style={{ fontSize: 28, fontWeight: 900, margin: "18px 0" }}>
        {winner || "Pas de vainqueur pour l’instant"}
      </div>
      <button onClick={() => navigate("/")}>Retour Home</button>
    </div>
  );
}
