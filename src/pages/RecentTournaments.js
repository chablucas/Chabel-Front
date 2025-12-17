import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./RecentTournaments.css";

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

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="card">
        <div className="headerRow">
          <h2 className="pageTitle">Tournois récents</h2>
          <button className="btn btn--ghost" type="button" onClick={load}>
            Rafraîchir
          </button>
        </div>

        {tournaments.length === 0 ? (
          <p className="hint">Aucun tournoi.</p>
        ) : (
          <div className="list">
            {tournaments.map((t) => (
              <div className="row" key={t._id}>
                <div className="rowLeft">
                  <div className="rowTitle">{t.name}</div>
                  <div className="rowSub">
                    Mode : {t.mode === "groups32" ? "Poules (32)" : "Éliminatoire"}
                  </div>
                </div>

                <div className="rowActions">
                  <button
                    className="btn btn--primary"
                    type="button"
                    onClick={() => navigate(`/tournament/${t._id}`)}
                  >
                    Ouvrir
                  </button>

                  <button
                    className="btn btn--danger"
                    type="button"
                    onClick={() => handleDelete(t._id)}
                    disabled={busyId === t._id}
                  >
                    {busyId === t._id ? "Suppression..." : "Supprimer"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
