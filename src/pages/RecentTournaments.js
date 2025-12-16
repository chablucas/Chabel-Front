import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function RecentTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/tournaments");
      setTournaments(res.data || []);
    } catch (e) {
      console.error(e);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    try {
      setBusyId(id);
      await api.delete(`/tournaments/${id}`);
      setTournaments((prev) => prev.filter((t) => t._id !== id));
    } catch (e) {
      console.error(e);
      alert("Impossible de supprimer le tournoi.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Chargement...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Tournois récents</h2>

      {tournaments.length === 0 ? (
        <p>Aucun tournoi.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {tournaments.map((t) => (
            <div
              key={t._id}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>{t.name}</div>
                <div style={{ opacity: 0.8 }}>
                  Mode : {t.mode === "groups32" ? "Poules (32)" : "Éliminatoire"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => navigate(`/tournaments/${t._id}`)}>
                  Ouvrir
                </button>
                <button
                  onClick={() => handleDelete(t._id)}
                  disabled={busyId === t._id}
                  style={{ opacity: busyId === t._id ? 0.6 : 1 }}
                >
                  {busyId === t._id ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
