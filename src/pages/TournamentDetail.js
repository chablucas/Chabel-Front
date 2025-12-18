import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import "./TournamentDetail.css";

function BracketMatch({ match, onChangeScore, onValidate, disabled }) {
  const home = match.home || "—";
  const away = match.away || "—";

  const isBye =
    (!!match.home && !match.away) ||
    (!match.home && !!match.away) ||
    (!match.home && !match.away);

  const scoreDisabled = disabled || match.isValidated || isBye || !match.home || !match.away;

  return (
    <div className={`brMatch ${match.isValidated ? "brMatch--validated" : ""}`}>
      <div className="brLine">
        <span className="brTeam">{home}</span>
        <input
          className="brScore"
          type="number"
          min={0}
          value={match.homeScore ?? 0}
          disabled={scoreDisabled}
          onChange={(e) => onChangeScore(match.matchId, "homeScore", Number(e.target.value))}
        />
      </div>

      <div className="brLine">
        <span className="brTeam">{away}</span>
        <input
          className="brScore"
          type="number"
          min={0}
          value={match.awayScore ?? 0}
          disabled={scoreDisabled}
          onChange={(e) => onChangeScore(match.matchId, "awayScore", Number(e.target.value))}
        />
      </div>

      <div className="brAction">
        {match.isValidated ? (
          <span className="brInfo">✅ {match.winner || "Validé"}</span>
        ) : isBye ? (
          <span className="brInfo brInfo--muted">BYE / Slot vide</span>
        ) : (
          <button
            className="btn btn--primary brBtn"
            onClick={() => onValidate(match)}
            disabled={disabled || !match.home || !match.away}
            type="button"
          >
            Valider
          </button>
        )}
      </div>
    </div>
  );
}

function roundLabel(key) {
  if (key === "R32") return "32e";
  if (key === "R16") return "16e";
  if (key === "QF") return "Quarts";
  if (key === "SF") return "Demies";
  return "Finale";
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

  const isDuel = useMemo(() => {
    return tournament?.duel?.enabled === true && Array.isArray(tournament?.duel?.players) && tournament.duel.players.length === 2;
  }, [tournament]);

  const duelPlayers = useMemo(() => {
    if (!isDuel) return null;
    const p1 = tournament.duel.players[0];
    const p2 = tournament.duel.players[1];
    return {
      p1: { name: p1?.name || "Joueur 1", teams: Array.isArray(p1?.teams) ? p1.teams : [] },
      p2: { name: p2?.name || "Joueur 2", teams: Array.isArray(p2?.teams) ? p2.teams : [] },
      perPlayer: tournament.duel.perPlayer || null,
      meta: tournament.duel.meta || null,
    };
  }, [isDuel, tournament]);

  // ✅ rounds normalisés (Map ou object)
  const roundsObj = useMemo(() => {
    const r = tournament?.knockout?.rounds;
    if (!r) return {};
    if (r instanceof Map) return Object.fromEntries(r.entries());
    return r;
  }, [tournament]);

  // ✅ ordre dynamique selon ce qui existe
  const roundsOrder = useMemo(() => {
    const keys = Object.keys(roundsObj || {});
    const order = ["R32", "R16", "QF", "SF", "F"];
    return order.filter((k) => keys.includes(k) && Array.isArray(roundsObj[k]) && roundsObj[k].length > 0);
  }, [roundsObj]);

  function updateLocalScore(matchId, field, value) {
    setTournament((prev) => {
      if (!prev) return prev;
      const clone = structuredClone(prev);

      const rounds = clone.knockout?.rounds || {};
      for (const rk of Object.keys(rounds)) {
        const m = (rounds[rk] || []).find((x) => x.matchId === matchId);
        if (m) {
          m[field] = value;
          return clone;
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

  const hasBracket = roundsOrder.length > 0;

  return (
    <div className="page">
      <div className="detailHeader">
        <div>
          <h2 className="pageTitle">{tournament.name}</h2>
          <div className="hint">
            Mode : {tournament.mode === "groups32" ? "Poules (32 équipes)" : "Éliminatoire direct"}
            {isDuel ? " — Duel 1v1" : ""}
          </div>
        </div>

        <button className="btn btn--ghost" onClick={() => navigate("/")} type="button">
          Home
        </button>
      </div>

      {/* DUEL PLAYERS */}
      {isDuel && duelPlayers && (
        <div className="duelHeader">
          <div className="duelCard">
            <div className="duelCardTitle">{duelPlayers.p1.name}</div>
            <div className="duelCardSub">{duelPlayers.perPlayer ? `${duelPlayers.perPlayer} équipes` : ""}</div>
            <div className="duelTeams">
              {duelPlayers.p1.teams.map((team) => (
                <div className="duelTeam duelTeam--p1" key={team}>
                  {team}
                </div>
              ))}
            </div>
          </div>

          <div className="duelCard">
            <div className="duelCardTitle">{duelPlayers.p2.name}</div>
            <div className="duelCardSub">{duelPlayers.perPlayer ? `${duelPlayers.perPlayer} équipes` : ""}</div>
            <div className="duelTeams">
              {duelPlayers.p2.teams.map((team) => (
                <div className="duelTeam duelTeam--p2" key={team}>
                  {team}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BRACKET */}
      <div className="blocks">
        {!hasBracket ? (
          <p className="note">Aucun tableau généré (bracket vide).</p>
        ) : (
          <div className="bracketWrap">
            {roundsOrder.map((rk) => (
              <div className="bracketCol" key={rk}>
                <div className="bracketColTitle">{roundLabel(rk)}</div>

                <div className="bracketMatches">
                  {(roundsObj[rk] || []).map((m) => (
                    <BracketMatch
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
          </div>
        )}

        {tournament.knockout?.winner && (
          <button className="btn btn--primary" onClick={() => navigate(`/winner/${id}`)} type="button">
            Voir le vainqueur
          </button>
        )}
      </div>
    </div>
  );
}
