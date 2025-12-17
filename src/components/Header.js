import { NavLink, useNavigate } from "react-router-dom";
import "./Header.css";
import logo from "../assets/Logo-bg.png";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header__inner">
        <button type="button" className="header__brandBtn" onClick={() => navigate("/")}>
          <img src={logo} alt="Legacy Eleven" className="header__logoImg" />
          <span className="header__title">Legacy Eleven</span>
        </button>

        <nav className="header__nav">
          <NavLink to="/recent" className={({ isActive }) => isActive ? "header__link header__link--active" : "header__link"}>Récents</NavLink>
          <NavLink to="/create" className={({ isActive }) => isActive ? "header__link header__link--active" : "header__link"}>Créer</NavLink>
          <NavLink to="/draw" className={({ isActive }) => isActive ? "header__link header__link--active" : "header__link"}>Tirage</NavLink>
          <NavLink to="/wtf" className={({ isActive }) => isActive ? "header__link header__link--active" : "header__link"}>WTF</NavLink>
        </nav>
      </div>
    </header>
  );
}
