import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1>🏆 The Legacy Eleven</h1>
      <p>
        Crée des tournois FC entre clubs et sélections, officiels ou WTF,
        et suis l’évolution des compétitions match après match.
      </p>

      <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
        <Link to="/create">
          <button>Créer un tournoi officiel</button>
        </Link>

        <Link to="/recent">
          <button>Tournois récents</button>
        </Link>
      </div>

      <hr style={{ margin: "32px 0" }} />

      <section>
        <h2>Concept</h2>
        <ul>
          <li>1 page = 1 tournoi</li>
          <li>Tournois officiels (UCL, Coupe du monde…)</li>
          <li>Mode WTF personnalisable</li>
          <li>Random équilibré par étoiles ⭐</li>
        </ul>
      </section>
    </div>
  );
}
