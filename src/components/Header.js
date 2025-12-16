import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header
      style={{
        padding: 16,
        borderBottom: "1px solid #333",
        display: "flex",
        gap: 16,
        alignItems: "center",
      }}
    >
      <strong>The Legacy Eleven</strong>

      <nav style={{ display: "flex", gap: 12 }}>
        <Link to="/">Home</Link>
        <Link to="/create">Créer</Link>
        <Link to="/recent">Récents</Link>
        <Link to="/wtf">WTF</Link>
      </nav>
    </header>
  );
}
