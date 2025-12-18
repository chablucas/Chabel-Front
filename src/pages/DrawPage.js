import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./DrawPage.css";

const STAR_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

const COMPETITIONS = [
  { label: "Amicaux internationaux (Clubs - Hommes)", tag: "friendly_international_clubs", type: "club", gender: "male" },
  { label: "Championnat (Clubs - Hommes)", tag: "league", type: "club", gender: "male" },
  { label: "Ligue des Champions (Clubs - Hommes)", tag: "ucl", type: "club", gender: "male" },

  { label: "Amicaux internationaux (Nations - Hommes)", tag: "friendly_international_nations", type: "national", gender: "male" },
  { label: "Coupe du Monde (Nations - Hommes)", tag: "world_cup", type: "national", gender: "male" },
  { label: "Compétition continentale (Nations - Hommes)", tag: "continental", type: "national", gender: "male" },

  { label: "Coupe du Monde (Nations - Femmes)", tag: "world_cup_women", type: "national", gender: "female" },
];

function starLabel(v) {
  const half = Number.isInteger(v) ? "" : "½";
  const base = Number.isInteger(v) ? v : Math.floor(v);
  return `${base}${half}⭐`;
}

export default function DrawPage() {
  const navigate = useNavigate();

  const [competitionKey, setCompetitionKey] = useState(0);
  const competition = COMPETITIONS[competitionKey];

  const [count, setCount] = useState(16);

  const perPlayer = Number(count) / 2;

  const [starsMode, setStarsMode] = useState("simple"); // "simple" | "mix"
  const [starsSelected, setStarsSelected] = useState([5]);

  const [mixAStars, setMixAStars] = useState(5);
  const [mixACount, setMixACount] = useState(8);
  const [mixBStars, setMixBStars] = useState(4.5);
  const [mixBCount, setMixBCount] = useState(8);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const canDraw = useMemo(() => {
    if (!competition?.tag || !competition?.type || !competition?.gender) return false;
    if (![8, 16, 32].includes(Number(count))) return false;

    if (starsMode === "simple") {
      return Array.isArray(starsSelected) && starsSelected.length > 0;
    }

    const total = Number(mixACount) + Number(mixBCount);
    return total === Number(count);
  }, [competition, count, starsMode, starsSelected, mixACount, mixBCount]);

  function toggleStar(s) {
    setStarsSelected((prev) => {
      const set = new Set(prev);
      if (set.has(s)) set.delete(s);
      else set.add(s);
      return [...set].sort((a, b) => a - b);
    });
  }

  function clearStars() {
    setStarsSelected([]);
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
        totalTeams: Number(count),
        perPlayer: Number(perPlayer),
      };

      if (starsMode === "simple") {
        payload.stars = starsSelected;
      } else {
        payload.mix = [
          { stars: Number(mixAStars), count: Number(mixACount) },
          { stars: Number(mixBStars), count: Number(mixBCount) },
        ];
      }

      const res = await api.post("/draw", payload);
      setResult(res.data); // {left,right,meta}
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Erreur tirage.");
    } finally {
      setLoading(false);
    }
  }

  async function createTournamentFromDraw() {
    if (!result?.left?.length || !result?.right?.length) return;

    try {
      const res = await api.post("/tournaments", {
        name: `Duel - ${competition.label}`,
        mode: "1v1",
        perPlayer: Number(perPlayer),
        tag: competition.tag,
        type: competition.type,
        gender: competition.gender,
        players: [
          { name: "Joueur 1", teams: result.left.map((t) => t.name) },
          { name: "Joueur 2", teams: result.right.map((t) => t.name) },
        ],
        meta: result.meta || null,
      });

      navigate(`/tournament/${res.data._id}`);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Impossible de créer le tournoi.");
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="drawHeader">
          <div>
            <h2 className="pageTitle">🎲 Tirage 1v1</h2>
            <div className="hint">
              Tous les formats sont en duel : <b>8</b> (4v4), <b>16</b> (8v8), <b>32</b> (16v16).
            </div>
          </div>

          <button className="btn btn--ghost" type="button" onClick={() => navigate("/")}>
            Home
          </button>
        </div>

        <div className="grid">
          <div className="field">
            <label className="label">Compétition</label>
            <select
              className="select"
              value={competitionKey}
              onChange={(e) => setCompetitionKey(Number(e.target.value))}
            >
              {COMPETITIONS.map((c, idx) => (
                <option key={c.tag + idx} value={idx}>
                  {c.label}
                </option>
              ))}
            </select>

            <div className="hint">
              Type: <b>{competition.type}</b> — Genre: <b>{competition.gender}</b> — Tag:{" "}
              <b>{competition.tag}</b>
            </div>
          </div>

          <div className="field">
            <label className="label">Nombre d’équipes (duel)</label>
            <select className="select" value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[8, 16, 32].map((n) => (
                <option key={n} value={n}>
                  {n} → {n / 2} vs {n / 2}
                </option>
              ))}
            </select>
            <div className="hint">
              Joueur 1 : <b>{perPlayer}</b> équipes — Joueur 2 : <b>{perPlayer}</b> équipes
            </div>
          </div>

          <div className="field">
            <label className="label">Filtre étoiles</label>

            <div className="chips">
              <button
                type="button"
                className={starsMode === "simple" ? "chip chip--active" : "chip"}
                onClick={() => setStarsMode("simple")}
              >
                Simple
              </button>

              <button
                type="button"
                className={starsMode === "mix" ? "chip chip--active" : "chip"}
                onClick={() => setStarsMode("mix")}
              >
                Mix (2 pools)
              </button>
            </div>

            {starsMode === "simple" ? (
              <>
                <div className="stars">
                  {STAR_VALUES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={starsSelected.includes(s) ? "starBtn starBtn--active" : "starBtn"}
                      onClick={() => toggleStar(s)}
                    >
                      {starLabel(s)}
                    </button>
                  ))}
                </div>

                <div className="selectedStars">
                  <div className="selectedStars__label">Sélection :</div>
                  <div className="selectedStars__chips">
                    {starsSelected.length === 0 ? (
                      <span className="selectedStars__empty">Aucune</span>
                    ) : (
                      starsSelected.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="selectedStars__chip"
                          onClick={() => toggleStar(s)}
                          title="Retirer"
                        >
                          {starLabel(s)} ✕
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={clearStars}
                    disabled={starsSelected.length === 0}
                  >
                    Tout retirer
                  </button>
                </div>

                {!canDraw && <div className="error">Sélectionne au moins une étoile.</div>}
              </>
            ) : (
              <div className="mix">
                <div className="mixRow">
                  <b>Pool A</b>
                  <select className="select" value={mixAStars} onChange={(e) => setMixAStars(Number(e.target.value))}>
                    {STAR_VALUES.map((s) => (
                      <option key={s} value={s}>{starLabel(s)}</option>
                    ))}
                  </select>
                  <input className="input input--small" type="number" min={0} value={mixACount} onChange={(e) => setMixACount(Number(e.target.value))} />
                </div>

                <div className="mixRow">
                  <b>Pool B</b>
                  <select className="select" value={mixBStars} onChange={(e) => setMixBStars(Number(e.target.value))}>
                    {STAR_VALUES.map((s) => (
                      <option key={s} value={s}>{starLabel(s)}</option>
                    ))}
                  </select>
                  <input className="input input--small" type="number" min={0} value={mixBCount} onChange={(e) => setMixBCount(Number(e.target.value))} />
                </div>

                <div className="hint">
                  Total demandé: <b>{count}</b> — Total mix: <b>{Number(mixACount) + Number(mixBCount)}</b>{" "}
                  {(Number(mixACount) + Number(mixBCount)) === Number(count) ? "✅" : "❌"}
                </div>
              </div>
            )}
          </div>

          <div className="actions">
            <button type="button" className="btn btn--primary" onClick={handleDraw} disabled={!canDraw || loading}>
              {loading ? "Tirage..." : "Faire le tirage"}
            </button>

            <button type="button" className="btn btn--ghost" onClick={() => navigate("/recent")}>
              Retour
            </button>
          </div>
        </div>
      </div>

      {result?.left?.length > 0 && result?.right?.length > 0 && (
        <div className="card card--spaced">
          <div className="resultHeader">
            <h3 className="resultTitle">✅ Résultat du tirage</h3>
            <button type="button" className="btn btn--primary" onClick={createTournamentFromDraw}>
              Créer un tournoi avec ce tirage
            </button>
          </div>

          {result?.meta && (
            <div className="metaBox">
              <div className="metaLine"><b>J1 total:</b> {result.meta.leftSum}★</div>
              <div className="metaLine"><b>J2 total:</b> {result.meta.rightSum}★</div>
            </div>
          )}

          <div className="duelGrid">
            <div className="duelCol">
              <div className="duelTitle">Joueur 1</div>
              <div className="teamsGrid">
                {result.left.map((t) => (
                  <div className="teamCard" key={t.name}>
                    <div className="teamName">{t.name}</div>
                    <div className="teamMeta">
                      {t.type} — {t.gender} — {starLabel(Number(t.stars))}
                    </div>
                    {t.league && <div className="teamMeta teamMeta--muted">{t.league}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="duelCol">
              <div className="duelTitle">Joueur 2</div>
              <div className="teamsGrid">
                {result.right.map((t) => (
                  <div className="teamCard" key={t.name}>
                    <div className="teamName">{t.name}</div>
                    <div className="teamMeta">
                      {t.type} — {t.gender} — {starLabel(Number(t.stars))}
                    </div>
                    {t.league && <div className="teamMeta teamMeta--muted">{t.league}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
