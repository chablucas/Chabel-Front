import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const COMPETITIONS = [
  // Clubs
  { label: "Amicaux internationaux (Clubs)", tag: "friendly_international_clubs", type: "club", gender: "male" },
  { label: "Ligue des Champions", tag: "ucl", type: "club", gender: "male" },

  // Nations
  { label: "Amicaux internationaux (Sélections)", tag: "friendly_international_nations", type: "national", gender: "male" },
  { label: "Coupe du Monde", tag: "world_cup", type: "national", gender: "male" },

  // Femmes
  { label: "Coupe du Monde (F)", tag: "world_cup_women", type: "national", gender: "female" },
];

export default function DrawPage() {
  const navigate = useNavigate();

  const [competitionKey, setCompetitionKey] = useState(0);
  const competition = COMPETITIONS[competitionKey];

  const [count, setCount] = useState(16);

  // Mode étoiles : simple ou mix
  const [starsMode, setStarsMode] = useState("simple"); // "simple" | "mix"
  const [starsSelected, setStarsSelected] = useState([5]); // pour simple
  const [mixAStars, setMixAStars] = useState(5);
  const [mixACount, setMixACount] = useState(8);
  const [mixBStars, setMixBStars] = useState(4);
  const [mixBCount, setMixBCount] = useState(8);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const canDraw = useMemo(() => {
    if (starsMode === "simple") return count > 0;
    return (mixACount + mixBCount) === Number(count);
  }, [starsMode, count, mixACount, mixBCount]);

  function toggleStar(s) {
    setStarsSelected(prev => {
      const set = new Set(prev);
      if (set.has(s)) set.delete(s);
      else set.add(s);
      return [...set].sort();
    });
  }

  async function handleDraw() {
    if (!canDraw) return;

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        tag: competition.tag,
        type: competition.type,
        gender: competition.gender,
        count: Number(count),
      };

      if (starsMode === "simple") {
        payload.stars = starsSelected; // ex: [5] ou [3,4]
      } else {
        payload.mix = [
          { stars: Number(mixAStars), count: Number(mixACount) },
          { stars: Number(mixBStars), count: Number(mixBCount) },
        ];
      }

      const res = await api.post("/draw", payload);
      setResult(res.data);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Erreur tirage.");
    } finally {
      setLoading(false);
    }
  }

  async function createTournamentFromDraw() {
    if (!result?.teams?.length) return;

    try {
      const res = await api.post("/tournaments", {
        name: `Tournoi - ${competition.label}`,
        mode: "knockout", // ou groups32 si tu veux
        teams: result.teams.map(t => t.name),
      });

      navigate(`/tournament/${res.data._id}`);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Impossible de créer le tournoi.");
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>🎲 Tirage au sort</h2>

      <div style={{ display: "grid", gap: 12, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: 12 }}>
        {/* Compétition */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 800 }}>Compétition</label>
          <select
            value={competitionKey}
            onChange={(e) => setCompetitionKey(Number(e.target.value))}
            style={{
              padding: 10, borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.2)", color: "white"
            }}
          >
            {COMPETITIONS.map((c, idx) => (
              <option key={c.tag + idx} value={idx}>{c.label}</option>
            ))}
          </select>

          <div style={{ opacity: 0.85 }}>
            Type: <b>{competition.type}</b> — Genre: <b>{competition.gender}</b>
          </div>
        </div>

        {/* Nombre d'équipes */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 800 }}>Nombre d’équipes</label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{
              padding: 10, borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.2)", color: "white"
            }}
          >
            {[8, 16, 32].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Mode étoiles */}
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontWeight: 800 }}>Filtre étoiles</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setStarsMode("simple")}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: starsMode === "simple" ? "rgba(255,255,255,0.12)" : "transparent", color: "white" }}
            >
              Simple
            </button>
            <button
              onClick={() => setStarsMode("mix")}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: starsMode === "mix" ? "rgba(255,255,255,0.12)" : "transparent", color: "white" }}
            >
              Mix (ex: 5⭐ + 4⭐)
            </button>
          </div>

          {starsMode === "simple" ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  onClick={() => toggleStar(s)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: starsSelected.includes(s) ? "rgba(255,255,255,0.12)" : "transparent",
                    color: "white"
                  }}
                >
                  {s}⭐
                </button>
              ))}
              <div style={{ opacity: 0.85, alignSelf: "center" }}>
                Sélection: <b>{starsSelected.join(", ") || "aucune"}</b>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <b>Pool A</b>
                <span>Étoiles</span>
                <select value={mixAStars} onChange={(e) => setMixAStars(Number(e.target.value))}>
                  {[1,2,3,4,5].map(s => <option key={s} value={s}>{s}⭐</option>)}
                </select>
                <span>Nombre</span>
                <input type="number" min={0} value={mixACount} onChange={(e) => setMixACount(Number(e.target.value))} />
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <b>Pool B</b>
                <span>Étoiles</span>
                <select value={mixBStars} onChange={(e) => setMixBStars(Number(e.target.value))}>
                  {[1,2,3,4,5].map(s => <option key={s} value={s}>{s}⭐</option>)}
                </select>
                <span>Nombre</span>
                <input type="number" min={0} value={mixBCount} onChange={(e) => setMixBCount(Number(e.target.value))} />
              </div>

              <div style={{ opacity: 0.85 }}>
                Total demandé: <b>{count}</b> — Total mix: <b>{mixACount + mixBCount}</b>
                {canDraw ? " ✅" : " ❌ (le total mix doit égaler le nombre d’équipes)"}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleDraw}
            disabled={!canDraw || loading}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.10)",
              color: "white",
              opacity: (!canDraw || loading) ? 0.6 : 1
            }}
          >
            {loading ? "Tirage..." : "Faire le tirage"}
          </button>

          <button
            onClick={() => navigate("/recent")}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "white",
            }}
          >
            Retour
          </button>
        </div>
      </div>

      {/* Résultat */}
      {result?.teams?.length > 0 && (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <h3 style={{ margin: 0 }}>✅ Résultat du tirage</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
            {result.teams.map((t) => (
              <div key={t.name} style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: 10 }}>
                <div style={{ fontWeight: 900 }}>{t.name}</div>
                <div style={{ opacity: 0.85 }}>{t.type} — {t.gender} — {t.stars}⭐</div>
              </div>
            ))}
          </div>

          <button
            onClick={createTournamentFromDraw}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.10)",
              color: "white",
              justifySelf: "start"
            }}
          >
            Créer un tournoi avec ce tirage
          </button>
        </div>
      )}
    </div>
  );
}
