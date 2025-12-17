import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <span>© {new Date().getFullYear()} Legacy Eleven</span>
        <span className="footer__sep">•</span>
        <span className="footer__muted">Tournois FIFA/FC — Pascal & Lucas</span>
      </div>
    </footer>
  );
}
