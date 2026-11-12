import React, { useState, useEffect } from "react";
import { SuggestTheme, VoteThemes } from "./Suggestions";
import "../css/footer.css";

const Footer = () => {
  const [modal, setModal] = useState(null); // null | "suggest" | "vote"

  // Close the popup with the Escape key
  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (e) => e.key === "Escape" && setModal(null);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal]);

  return (
    <>
      <div className="footer">
        <button className="suggest-btn" onClick={() => setModal("suggest")}>
          💡 Sugerir tema
        </button>
        <p>Desenvolvido por Whydsley - 2025</p>
        <button className="vote-btn" onClick={() => setModal("vote")}>
          🗳️ Ajude a votar nos temas
        </button>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setModal(null)}
              aria-label="Fechar"
            >
              ✕
            </button>
            {modal === "suggest" && <SuggestTheme />}
            {modal === "vote" && <VoteThemes />}
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
