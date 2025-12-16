import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

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
        section: selectedSection, // clubMen/clubWomen/nationalMen/nationalWomen
        starsMode, // balanced/any
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
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2>Mode WTF</h2>
      <p style={{ opacity: 0.8 }}>
        Choisis le nombre d’équipes, une section (club/nation + M/F) et un tirage aléatoire par étoiles.
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>
          Nom du tournoi
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            placeholder="Ex: WTF du soir"
          />
        </label>

        <label>
          Nombre d’équipes (2 à 64)
          <input
            type="number"
            value={teamCount}
            onChange={(e) => setTeamCount(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            min={2}
            max={64}
          />
        </label>

        <label>
          Section équipes
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          >
            {SECTIONS.map((s) => (
              <option key={s.key} value={s.section}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Aléatoire par étoiles
          <select
            value={starsMode}
            onChange={(e) => setStarsMode(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          >
            <option value="balanced">Balanced (mix 5⭐/4⭐/3⭐...)</option>
            <option value="any">Full random</option>
          </select>
        </label>

        <button
          onClick={createWtfAndAutofill}
          disabled={!canCreate || loading}
          style={{ padding: 12, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Création..." : "Créer + Tirage"}
        </button>

        {err && <p style={{ color: "tomato" }}>Erreur : {err}</p>}
      </div>

      <div style={{ marginTop: 18, opacity: 0.75, fontSize: 13 }}>
        Astuce : si tu n’as pas assez d’équipes dans une section, ajoute-en dans le seed (ou baisse teamCount).
      </div>
    </div>
  );
}
