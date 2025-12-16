export default function Footer() {
  return (
    <footer
      style={{
        padding: 16,
        borderTop: "1px solid #333",
        textAlign: "center",
        opacity: 0.7,
      }}
    >
      © {new Date().getFullYear()} The Legacy Eleven — Projet personnel
    </footer>
  );
}
