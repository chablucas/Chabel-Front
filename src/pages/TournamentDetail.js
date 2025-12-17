import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import "./TournamentDetail.css";

function MatchRow({ match, onChangeScore, onValidate, disabled }) {
  const home = match.home || "—";
  const away = match.away || "—";

  const isBye =
    (!!match.home && !match.away) || (!match.home && !!match.away) || (!match.home && !match.away);

  const scoreDisabled = disabled || match.isValidated || isBye || !match.home || !match.away;

  return (
    <div className="matchRow">
      <div className="matchTeam matchTeam--home">{home}</div>

      <input
        className="matchScore"
        type="number"
        min={0}
        value={match.homeScore ?? 0}
        disabled={scoreDisabled}
        onChange={(e) => onChangeScore(match.matchId, "homeScore", Number(e.target.value))}
      />

      <div className="matchDash">-</div>

      <input
        className="matchScore"
        type="number"
        min={0}
        value={match.awayScore ?? 0}
        disabled={scoreDisabled}
        onChange={(e) => onChangeScore(match.matchId, "awayScore", Number(e.target.value))}
      />

      <div className="matchTeam matchTeam--away">{away}</div>

      <div className="matchAction">
        {match.isValidated ? (
          <span className="matchInfo">
            ✅ Validé{match.winner ? ` → ${match.winner}` : ""}
          </span>
        ) : isBye ? (
          <span className="matchInfo matchInfo--muted">BYE / Slot vide</span>
        ) : (
          <button
            className="btn btn--primary"
            onClick={() => onValidate(match)}
            disabled={disabled || !match.home || !match.away}
            type="button"
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

  if (loading) return <div className="loading">Chargement...</div>;
  if (!tournament) return <div className="loading">Tournoi introuvable.</div>;

  return (
    <div className="page">
      {/* HEADER */}
      <div className="detailHeader">
        <div>
          <h2 className="pageTitle">{tournament.name}</h2>
          <div className="hint">
            Mode :{" "}
            {tournament.mode === "groups32" ? "Poules (32 équipes)" : "Éliminatoire direct"}
          </div>
        </div>

        <button className="btn btn--ghost" onClick={() => navigate("/")} type="button">
          Home
        </button>
      </div>

      {/* MODE POULES */}
      {tournament.mode === "groups32" && (
        <div className="blocks">
          {(tournament.groups || []).map((g) => (
            <div className="block" key={g.key}>
              <h3 className="blockTitle">Groupe {g.key}</h3>

              {tournament.tables?.[g.key] && (
                <div className="tableWrap">
                  <table className="table">
                    <thead>
                      <tr>
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
                          <td className="tableTeam">{row.team}</td>
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

              <div className="matchList">
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

          <div className="note">
            ⚠️ Ici tu valides les matchs de poules. (Ensuite on peut générer l’éliminatoire automatiquement.)
          </div>
        </div>
      )}

      {/* MODE ELIMINATOIRE */}
      {tournament.mode === "knockout" && (
        <div className="blocks">
          {knockoutRounds.length === 0 ? (
            <p className="note">
              Aucun tableau généré (liste d’équipes vide).
            </p>
          ) : (
            knockoutRounds.map((r) => (
              <div className="block" key={r.key}>
                <h3 className="blockTitle">
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

                <div className="matchList">
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
            <button className="btn btn--primary" onClick={() => navigate(`/winner/${id}`)} type="button">
              Voir le vainqueur
            </button>
          )}
        </div>
      )}
    </div>
  );
}
