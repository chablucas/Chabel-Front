import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./Wtf.css";

const SECTIONS = [
  { key: "clubMen", label: "Clubs Masculins", section: "clubMen" },
  { key: "clubWomen", label: "Clubs Féminins", section: "clubWomen" },
  { key: "nationalMen", label: "Nations Masculines", section: "nationalMen" },
  { key: "nationalWomen", label: "Nations Féminines", section: "nationalWomen" },
];

export default function Wtf() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("WTF");
  const [teamCount, setTeamCount] = useState(8);
  const [selectedSection, setSelectedSection] = useState("clubMen");
  const [starsMode, setStarsMode] = useState("balanced"); // balanced | any
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canCreate = useMemo(() => {
    const n = Number(teamCount);
    return title.trim().length >= 2 && n >= 2 && n <= 64;
  }, [title, teamCount]);

  const createWtfAndAutofill = async () => {
    if (!canCreate) return;
    setErr("");
    setLoading(true);
    try {
      // 1) créer tournoi WTF
      const createRes = await api.post("/tournaments", {
        mode: "wtf",
        title: title.trim(),
        teamCount: Number(teamCount),
        genderMode: "mixed",
      });

      const id = createRes.data._id;

      // 2) auto-fill selon section + étoiles
      await api.patch(`/tournaments/${id}/autofill`, {
        section: selectedSection,
        starsMode,
      });

      // 3) redirection vers la page tournoi
      navigate(`/tournament/${id}`);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2 className="pageTitle">Mode WTF</h2>
        <p className="hint">
          Choisis le nombre d’équipes, une section (club/nation + M/F) et un tirage aléatoire par étoiles.
        </p>

        <div className="grid">
          <label className="field">
            <span className="label">Nom du tournoi</span>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: WTF du soir"
            />
          </label>

          <label className="field">
            <span className="label">Nombre d’équipes (2 à 64)</span>
            <input
              className="input"
              type="number"
              value={teamCount}
              onChange={(e) => setTeamCount(e.target.value)}
              min={2}
              max={64}
            />
          </label>

          <label className="field">
            <span className="label">Section équipes</span>
            <select
              className="select"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              {SECTIONS.map((s) => (
                <option key={s.key} value={s.section}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="label">Aléatoire par étoiles</span>
            <select
              className="select"
              value={starsMode}
              onChange={(e) => setStarsMode(e.target.value)}
            >
              <option value="balanced">Balanced (mix 5⭐/4⭐/3⭐...)</option>
              <option value="any">Full random</option>
            </select>
          </label>

          <div className="actions">
            <button
              className="btn btn--primary"
              onClick={createWtfAndAutofill}
              disabled={!canCreate || loading}
              type="button"
            >
              {loading ? "Création..." : "Créer + Tirage"}
            </button>

            <button className="btn btn--ghost" type="button" onClick={() => navigate("/")}>
              Retour Home
            </button>
          </div>

          {err && <p className="error">Erreur : {err}</p>}

          <div className="tip">
            Astuce : si tu n’as pas assez d’équipes dans une section, ajoute-en dans le seed (ou baisse teamCount).
          </div>
        </div>
      </div>
    </div>
  );
}
