import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./DrawPage.css";

const STAR_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

const COMPETITIONS = [
  // Clubs hommes
  { label: "Amicaux internationaux (Clubs - Hommes)", tag: "friendly_international_clubs", type: "club", gender: "male" },
  { label: "Championnat (Clubs - Hommes)", tag: "league", type: "club", gender: "male" },
  { label: "Ligue des Champions (Clubs - Hommes)", tag: "ucl", type: "club", gender: "male" },

  // Nations hommes
  { label: "Amicaux internationaux (Nations - Hommes)", tag: "friendly_international_nations", type: "national", gender: "male" },
  { label: "Coupe du Monde (Nations - Hommes)", tag: "world_cup", type: "national", gender: "male" },
  { label: "Compétition continentale (Nations - Hommes)", tag: "continental", type: "national", gender: "male" },

  // Nations femmes
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

  // Mode étoiles : simple ou mix
  const [starsMode, setStarsMode] = useState("simple"); // "simple" | "mix"
  const [starsSelected, setStarsSelected] = useState([5]);

  // mix: 2 pools
  const [mixAStars, setMixAStars] = useState(5);
  const [mixACount, setMixACount] = useState(8);
  const [mixBStars, setMixBStars] = useState(4.5);
  const [mixBCount, setMixBCount] = useState(8);

  const [loading, setLoading] = useState(false);

  // ✅ On stocke un "result" unique qui peut contenir:
  // - { left, right, meta } (mode 1v1 équilibré)
  // - { teams } (ancien mode)
  const [result, setResult] = useState(null);

  // ✅ Mode 1v1 auto UNIQUEMENT si count=8 (4 vs 4)
  const isBalanced1v1 = Number(count) === 8;
  const perPlayer = isBalanced1v1 ? 4 : null;

  const canDraw = useMemo(() => {
    if (!competition?.tag || !competition?.type || !competition?.gender) return false;

    if (starsMode === "simple") {
      return Number(count) > 0 && Array.isArray(starsSelected) && starsSelected.length > 0;
    }

    const total = Number(mixACount) + Number(mixBCount);
    if (Number(count) <= 0) return false;
    if (Number(mixACount) < 0 || Number(mixBCount) < 0) return false;
    return total === Number(count);
  }, [competition, starsMode, count, starsSelected, mixACount, mixBCount]);

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

        // ancien backend attend "count"
        count: Number(count),

        // ✅ nouveau backend peut utiliser ça pour split 1v1 équilibré
        totalTeams: Number(count),
        perPlayer: isBalanced1v1 ? perPlayer : undefined,
        balanced: isBalanced1v1, // indicateur optionnel
      };

      if (starsMode === "simple") {
        payload.stars = starsSelected; // ✅ peut contenir des .5
      } else {
        payload.mix = [
          { stars: Number(mixAStars), count: Number(mixACount) },
          { stars: Number(mixBStars), count: Number(mixBCount) },
        ];
      }

      const res = await api.post("/draw", payload);
      const data = res.data;

      // ✅ compat: si backend renvoie {left,right}, on garde, sinon {teams}
      if (Array.isArray(data?.left) && Array.isArray(data?.right)) {
        setResult({
          left: data.left,
          right: data.right,
          meta: data.meta || null,
        });
      } else {
        setResult({
          teams: data?.teams || [],
        });
      }
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Erreur tirage.");
    } finally {
      setLoading(false);
    }
  }

  async function createTournamentFromDraw() {
    // ✅ Mode équilibré (left/right)
    if (result?.left?.length && result?.right?.length) {
      try {
        const res = await api.post("/tournaments", {
          name: `Duel - ${competition.label}`,
          mode: "1v1",
          perPlayer: 4,
          tag: competition.tag,
          type: competition.type,
          gender: competition.gender,
          players: [
            { name: "Joueur 1", teams: result.left.map((t) => t.name) },
            { name: "Joueur 2", teams: result.right.map((t) => t.name) },
          ],
          meta: result.meta || undefined,
        });

        navigate(`/tournament/${res.data._id}`);
      } catch (e) {
        console.error(e);
        alert(e?.response?.data?.message || "Impossible de créer le tournoi.");
      }
      return;
    }

    // ✅ Ancien mode (teams)
    if (result?.teams?.length) {
      try {
        const res = await api.post("/tournaments", {
          name: `Tournoi - ${competition.label}`,
          mode: "knockout",
          teams: result.teams.map((t) => t.name),
        });

        navigate(`/tournament/${res.data._id}`);
      } catch (e) {
        console.error(e);
        alert(e?.response?.data?.message || "Impossible de créer le tournoi.");
      }
    }
  }

  const canCreate =
    (result?.left?.length === 4 && result?.right?.length === 4) ||
    (Array.isArray(result?.teams) && result.teams.length > 0);

  return (
    <div className="page">
      <div className="card">
        <div className="drawHeader">
          <div>
            <h2 className="pageTitle">🎲 Tirage au sort</h2>
            <div className="hint">
              {isBalanced1v1 ? (
                <>
                  Mode <b>DUEL 1v1</b> activé (8 équipes → 4 à gauche / 4 à droite) ✅
                </>
              ) : (
                <>
                  Choisis une compétition + un filtre étoiles, puis génère un tirage.
                </>
              )}
            </div>
          </div>

          <button className="btn btn--ghost" type="button" onClick={() => navigate("/")}>
            Home
          </button>
        </div>

        <div className="grid">
          {/* Compétition */}
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

          {/* Nombre d'équipes */}
          <div className="field">
            <label className="label">Nombre d’équipes</label>
            <select
              className="select"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[8, 16, 32].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 8 ? " (DUEL 1v1 équilibré)" : ""}
                </option>
              ))}
            </select>

            {Number(count) !== 8 && (
              <div className="hint">
                Le mode équilibré J1/J2 est prévu pour <b>8</b> (4 vs 4).
              </div>
            )}
          </div>

          {/* Mode étoiles */}
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

            {/* SIMPLE */}
            {starsMode === "simple" ? (
              <>
                <div className="stars">
                  {STAR_VALUES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={starsSelected.includes(s) ? "starBtn starBtn--active" : "starBtn"}
                      onClick={() => toggleStar(s)}
                      title={starsSelected.includes(s) ? "Retirer" : "Ajouter"}
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

                {!canDraw && (
                  <div className="error">
                    Sélectionne au moins une étoile pour pouvoir lancer le tirage.
                  </div>
                )}
              </>
            ) : (
              /* MIX */
              <div className="mix">
                <div className="mixRow">
                  <b>Pool A</b>
                  <select
                    className="select"
                    value={mixAStars}
                    onChange={(e) => setMixAStars(Number(e.target.value))}
                  >
                    {STAR_VALUES.map((s) => (
                      <option key={s} value={s}>
                        {starLabel(s)}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input input--small"
                    type="number"
                    min={0}
                    value={mixACount}
                    onChange={(e) => setMixACount(Number(e.target.value))}
                  />
                </div>

                <div className="mixRow">
                  <b>Pool B</b>
                  <select
                    className="select"
                    value={mixBStars}
                    onChange={(e) => setMixBStars(Number(e.target.value))}
                  >
                    {STAR_VALUES.map((s) => (
                      <option key={s} value={s}>
                        {starLabel(s)}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input input--small"
                    type="number"
                    min={0}
                    value={mixBCount}
                    onChange={(e) => setMixBCount(Number(e.target.value))}
                  />
                </div>

                <div className="hint">
                  Total demandé: <b>{count}</b> — Total mix:{" "}
                  <b>{Number(mixACount) + Number(mixBCount)}</b>{" "}
                  {canDraw ? "✅" : "❌ (doit être égal)"}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleDraw}
              disabled={!canDraw || loading}
            >
              {loading ? "Tirage..." : "Faire le tirage"}
            </button>

            <button type="button" className="btn btn--ghost" onClick={() => navigate("/recent")}>
              Retour
            </button>
          </div>
        </div>
      </div>

      {/* Résultat */}
      {canCreate && (
        <div className="card card--spaced">
          <div className="resultHeader">
            <h3 className="resultTitle">✅ Résultat du tirage</h3>

            <button type="button" className="btn btn--primary" onClick={createTournamentFromDraw}>
              Créer un tournoi avec ce tirage
            </button>
          </div>

          {/* ✅ Nouveau rendu DUEL 1v1 */}
          {result?.left?.length && result?.right?.length ? (
            <>
              {result?.meta && (
                <div className="metaBox">
                  <div className="metaLine">
                    <b>J1</b> total: {result.meta.leftSum}★
                  </div>
                  <div className="metaLine">
                    <b>J2</b> total: {result.meta.rightSum}★
                  </div>
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
            </>
          ) : (
            /* ✅ Ancien rendu */
            <div className="teamsGrid">
              {result.teams.map((t) => (
                <div className="teamCard" key={t.name}>
                  <div className="teamName">{t.name}</div>
                  <div className="teamMeta">
                    {t.type} — {t.gender} — {starLabel(Number(t.stars))}
                  </div>
                  {t.league && <div className="teamMeta teamMeta--muted">{t.league}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
