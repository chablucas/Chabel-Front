import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function CreateOfficial() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mode, setMode] = useState("knockout"); // "groups32" | "knockout"

  // Teams en entrée (simple)
  const [teamsText, setTeamsText] = useState("");
  const [loading, setLoading] = useState(false);

  const parsedTeams = useMemo(() => {
    const lines = teamsText
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);

    // remove duplicates
    return [...new Set(lines)];
  }, [teamsText]);

  const isGroupsMode = mode === "groups32";

  const canCreate = useMemo(() => {
    if (!name.trim()) return false;
    if (!mode) return false;

    if (isGroupsMode) {
      return parsedTeams.length === 32;
    }

    // knockout: teams peut être 0 (bracket vide) OU >=2
    return parsedTeams.length === 0 || parsedTeams.length >= 2;
  }, [name, mode, isGroupsMode, parsedTeams.length]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!canCreate) return;

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        mode,
        teams: parsedTeams, // [] autorisé en knockout
      };

      const res = await api.post("/tournaments", payload);

      // IMPORTANT: route detail = /tournament/:id (singulier)
      navigate(`/tournament/${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Erreur lors de la création du tournoi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>Créer un tournoi</h2>

      <form onSubmit={handleCreate} style={{ display: "grid", gap: 12 }}>
        {/* NOM */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 700 }}>Nom du tournoi</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Coupe du Monde Chabel"
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.2)",
              color: "white",
            }}
          />
        </div>

        {/* MODE */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 700 }}>Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.2)",
              color: "white",
            }}
          >
            <option value="knockout">Éliminatoire direct</option>
            <option value="groups32">Phase de poules (32 équipes)</option>
          </select>

          {isGroupsMode ? (
            <div style={{ opacity: 0.85 }}>
              ⚠️ En mode poules, il faut **exactement 32 équipes**.
            </div>
          ) : (
            <div style={{ opacity: 0.85 }}>
              ✅ En éliminatoire, tu peux mettre **0 équipe** (tournoi vide), ou **2+ équipes**.
              Si le nombre n’est pas une puissance de 2, on gère les **BYE** automatiquement.
            </div>
          )}
        </div>

        {/* TEAMS */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 700 }}>
            Équipes (1 par ligne) — {parsedTeams.length} sélectionnée(s)
          </label>
          <textarea
            value={teamsText}
            onChange={(e) => setTeamsText(e.target.value)}
            placeholder={
              isGroupsMode
                ? "Colle 32 équipes ici (1 par ligne)\nFC Barcelona\nReal Madrid\nPSG\n..."
                : "Optionnel en éliminatoire.\nSinon colle tes équipes ici (1 par ligne)."
            }
            rows={10}
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.2)",
              color: "white",
              resize: "vertical",
            }}
          />

          {isGroupsMode && parsedTeams.length !== 32 && (
            <div style={{ color: "#ffb3b3" }}>
              Il te faut {32 - parsedTeams.length} équipe(s) de plus pour valider.
            </div>
          )}

          {!isGroupsMode && parsedTeams.length === 1 && (
            <div style={{ color: "#ffb3b3" }}>
              En éliminatoire, il faut 0 équipe (vide) ou au moins 2 équipes.
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            disabled={!canCreate || loading}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.10)",
              color: "white",
              cursor: "pointer",
              opacity: !canCreate || loading ? 0.6 : 1,
            }}
          >
            {loading ? "Création..." : "Créer le tournoi"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/recent")}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "white",
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
