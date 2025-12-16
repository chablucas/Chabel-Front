import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

function MatchRow({ match, onChangeScore, onValidate, disabled }) {
  const home = match.home || "—";
  const away = match.away || "—";

  const isBye =
    (!!match.home && !match.away) || (!match.home && !!match.away) || (!match.home && !match.away);

  const scoreDisabled =
    disabled || match.isValidated || isBye || !match.home || !match.away;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 70px 30px 70px 1fr 170px",
        gap: 8,
        alignItems: "center",
        padding: 10,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <div style={{ fontWeight: 700 }}>{home}</div>

      <input
        type="number"
        min={0}
        value={match.homeScore ?? 0}
        disabled={scoreDisabled}
        onChange={(e) =>
          onChangeScore(match.matchId, "homeScore", Number(e.target.value))
        }
        style={{
          width: "100%",
          padding: 6,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(0,0,0,0.15)",
          color: "white",
        }}
      />

      <div style={{ textAlign: "center", opacity: 0.85 }}>-</div>

      <input
        type="number"
        min={0}
        value={match.awayScore ?? 0}
        disabled={scoreDisabled}
        onChange={(e) =>
          onChangeScore(match.matchId, "awayScore", Number(e.target.value))
        }
        style={{
          width: "100%",
          padding: 6,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(0,0,0,0.15)",
          color: "white",
        }}
      />

      <div style={{ fontWeight: 700, textAlign: "right" }}>{away}</div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        {match.isValidated ? (
          <span style={{ opacity: 0.95 }}>
            ✅ Validé{match.winner ? ` → ${match.winner}` : ""}
          </span>
        ) : isBye ? (
          <span style={{ opacity: 0.8 }}>BYE / Slot vide</span>
        ) : (
          <button
            onClick={() => onValidate(match)}
            disabled={disabled || !match.home || !match.away}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              cursor: "pointer",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            Match validé
          </button>
        )}
      </div>
    </div>
  );
}

export default function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ FIX ESLINT: load est dans le useEffect
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tournaments/${id}`);
        setTournament(res.data);
      } catch (e) {
        console.error(e);
        setTournament(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const knockoutRounds = useMemo(() => {
    if (!tournament?.knockout?.rounds) return [];

    // Selon comment Mongo/Express renvoie ton Map, ça peut être un objet
    const roundsObj = tournament.knockout.rounds;

    const order = ["R32", "R16", "QF", "SF", "F"];
    return order
      .filter((k) => Array.isArray(roundsObj[k]) && roundsObj[k].length > 0)
      .map((k) => ({ key: k, matches: roundsObj[k] }));
  }, [tournament]);

  function updateLocalScore(matchId, field, value) {
    setTournament((prev) => {
      if (!prev) return prev;

      const clone = structuredClone(prev);

      if (clone.mode === "groups32") {
        for (const g of clone.groups || []) {
          const m = (g.matches || []).find((x) => x.matchId === matchId);
          if (m) {
            m[field] = value;
            return clone;
          }
        }
      } else if (clone.mode === "knockout") {
        const rounds = clone.knockout?.rounds || {};
        for (const rk of Object.keys(rounds)) {
          const m = (rounds[rk] || []).find((x) => x.matchId === matchId);
          if (m) {
            m[field] = value;
            return clone;
          }
        }
      }

      return clone;
    });
  }

  async function saveMatch(match, validate = false) {
    setSaving(true);
    try {
      const res = await api.patch(`/tournaments/${id}/matches/${match.matchId}`, {
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        validate,
      });

      setTournament(res.data);

      // Si un vainqueur existe => page winner
      if (res.data?.knockout?.winner) {
        navigate(`/winner/${id}`);
      }
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Erreur validation match.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Chargement...</div>;
  if (!tournament) return <div style={{ padding: 16 }}>Tournoi introuvable.</div>;

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>{tournament.name}</h2>
          <div style={{ opacity: 0.8 }}>
            Mode :{" "}
            {tournament.mode === "groups32"
              ? "Poules (32 équipes)"
              : "Éliminatoire direct"}
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            color: "white",
            cursor: "pointer",
          }}
        >
          Home
        </button>
      </div>

      {/* MODE POULES */}
      {tournament.mode === "groups32" && (
        <div style={{ display: "grid", gap: 18 }}>
          {(tournament.groups || []).map((g) => (
            <div
              key={g.key}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 14,
                padding: 12,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Groupe {g.key}</h3>

              {/* Classement (si fourni par le backend) */}
              {tournament.tables?.[g.key] && (
                <div style={{ overflowX: "auto", marginBottom: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left", opacity: 0.9 }}>
                        <th>Équipe</th>
                        <th>Pts</th>
                        <th>J</th>
                        <th>BP</th>
                        <th>BC</th>
                        <th>Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournament.tables[g.key].map((row) => (
                        <tr key={row.team}>
                          <td style={{ fontWeight: 700 }}>{row.team}</td>
                          <td>{row.pts}</td>
                          <td>{row.played}</td>
                          <td>{row.gf}</td>
                          <td>{row.ga}</td>
                          <td>{row.gd}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Matchs */}
              <div style={{ display: "grid", gap: 10 }}>
                {(g.matches || []).map((m) => (
                  <MatchRow
                    key={m.matchId}
                    match={m}
                    disabled={saving}
                    onChangeScore={updateLocalScore}
                    onValidate={(match) => saveMatch(match, true)}
                  />
                ))}
              </div>
            </div>
          ))}

          <div style={{ opacity: 0.85 }}>
            ⚠️ Ici tu valides les matchs de poules. Si tu veux ensuite générer automatiquement l’éliminatoire
            (top 2 de chaque groupe → 8e), je te le branche direct.
          </div>
        </div>
      )}

      {/* MODE ELIMINATOIRE */}
      {tournament.mode === "knockout" && (
        <div style={{ display: "grid", gap: 16 }}>
          {knockoutRounds.length === 0 ? (
            <p>
              Aucun tableau généré (liste d’équipes vide). Si tu veux un écran “ajouter/sélectionner les équipes”
              dans cette page, je te l’ajoute.
            </p>
          ) : (
            knockoutRounds.map((r) => (
              <div
                key={r.key}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  {r.key === "R32"
                    ? "32e"
                    : r.key === "R16"
                    ? "8e"
                    : r.key === "QF"
                    ? "Quarts"
                    : r.key === "SF"
                    ? "Demies"
                    : "Finale"}
                </h3>

                <div style={{ display: "grid", gap: 10 }}>
                  {r.matches.map((m) => (
                    <MatchRow
                      key={m.matchId}
                      match={m}
                      disabled={saving}
                      onChangeScore={updateLocalScore}
                      onValidate={(match) => saveMatch(match, true)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          {tournament.knockout?.winner && (
            <button
              onClick={() => navigate(`/winner/${id}`)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                cursor: "pointer",
              }}
            >
              Voir le vainqueur
            </button>
          )}
        </div>
      )}
    </div>
  );
}
