import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="home__hero">
        <h1 className="home__title">Legacy Eleven</h1>
        <p className="home__subtitle">
          Crée des tournois, fais tes tirages au sort, gère les scores et sors un vainqueur.
        </p>

        <div className="home__actions">
          <button className="btn btn--primary" onClick={() => navigate("/recent")}>
            Voir les tournois
          </button>
          <button className="btn btn--ghost" onClick={() => navigate("/create")}>
            Créer un tournoi
          </button>
          <button className="btn btn--ghost" onClick={() => navigate("/draw")}>
            Tirage au sort
          </button>
        </div>
      </div>
    </div>
  );
}
