import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./CreateOfficial.css";

export default function CreateOfficial() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mode, setMode] = useState("knockout"); // "groups32" | "knockout"
  const [teamsText, setTeamsText] = useState("");
  const [loading, setLoading] = useState(false);

  const parsedTeams = useMemo(() => {
    const lines = teamsText
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    return [...new Set(lines)];
  }, [teamsText]);

  const isGroupsMode = mode === "groups32";

  const canCreate = useMemo(() => {
    if (!name.trim()) return false;
    if (!mode) return false;

    if (isGroupsMode) return parsedTeams.length === 32;
    return parsedTeams.length === 0 || parsedTeams.length >= 2;
  }, [name, mode, isGroupsMode, parsedTeams.length]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!canCreate) return;

    setLoading(true);
    try {
      const payload = { name: name.trim(), mode, teams: parsedTeams };
      const res = await api.post("/tournaments", payload);
      navigate(`/tournament/${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Erreur création tournoi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h2 className="pageTitle">Créer un tournoi</h2>

        <form onSubmit={handleCreate} className="form">
          <div className="field">
            <label className="label">Nom du tournoi</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Coupe du Monde Chabel"
            />
          </div>

          <div className="field">
            <label className="label">Mode</label>
            <select className="select" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="knockout">Éliminatoire direct</option>
              <option value="groups32">Phase de poules (32 équipes)</option>
            </select>

            <div className="hint">
              {isGroupsMode
                ? "⚠️ Poules: il faut exactement 32 équipes."
                : "✅ Knockout: tu peux mettre 0 équipe (vide) ou 2+ équipes."}
            </div>
          </div>

          <div className="field">
            <label className="label">Équipes (1 par ligne) — {parsedTeams.length}</label>
            <textarea
              className="textarea"
              value={teamsText}
              onChange={(e) => setTeamsText(e.target.value)}
              rows={10}
              placeholder={
                isGroupsMode
                  ? "Colle 32 équipes ici (1 par ligne)"
                  : "Optionnel en éliminatoire. Sinon colle tes équipes (1 par ligne)."
              }
            />
            {isGroupsMode && parsedTeams.length !== 32 && (
              <div className="error">
                Il te manque {32 - parsedTeams.length} équipe(s) pour valider.
              </div>
            )}
            {!isGroupsMode && parsedTeams.length === 1 && (
              <div className="error">En éliminatoire : 0 équipe (vide) ou au moins 2 équipes.</div>
            )}
          </div>

          <div className="actions">
            <button className="btn btn--primary" disabled={!canCreate || loading} type="submit">
              {loading ? "Création..." : "Créer"}
            </button>
            <button className="btn btn--ghost" type="button" onClick={() => navigate("/recent")}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
