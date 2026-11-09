import { useState, useEffect } from "react";

const API_URL = "http://localhost:3220";
const SAVE_PROGRESS = false; // set to true to save progress in localStorage (for testing)

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Content = () => {
  const [allContent, setAllContent] = useState([]);
  const [selectedSquares, setSelectedSquares] = useState([]);
  const [matchedGroups, setMatchedGroups] = useState([]);
  const [errorFlash, setErrorFlash] = useState([]);
  const [chances, setChances] = useState(4);
  const [gameOver, setGameOver] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState("00:00:00");
  const [isChecking, setIsChecking] = useState(false);
  const [puzzleDate, setPuzzleDate] = useState("");
  const [nextUpdate, setNextUpdate] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // 1. Load puzzle (and restore progress if it's the same day)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [themesRes, updateRes] = await Promise.all([
          fetch(`${API_URL}/daily-themes`),
          fetch(`${API_URL}/next-update`),
        ]);
        const { date, themes } = await themesRes.json();
        const { nextUpdate } = await updateRes.json();

        if (!Array.isArray(themes) || themes.length === 0) {
          console.error("Erro: Dados inválidos", themes);
          return;
        }

        setPuzzleDate(date);
        setNextUpdate(new Date(nextUpdate).getTime());

        const allWords = themes.flatMap((item) =>
          item.content.map((word) => ({ word, title: item.title })),
        );

        // Try to restore today's progress
        let saved = null;
        try {
          saved = JSON.parse(localStorage.getItem("farinha-progress"));
        } catch {
          saved = null;
        }

        if (SAVE_PROGRESS && saved && saved.date === date) {
          const foundTitles = saved.matchedGroups.map((g) => g.title);
          const remaining = allWords.filter(
            (w) => !foundTitles.includes(w.title),
          );
          setAllContent(shuffleArray(remaining));
          setMatchedGroups(saved.matchedGroups);
          setChances(saved.chances);
          if (saved.chances === 0 || saved.matchedGroups.length === 4) {
            setGameOver(true);
          }
        } else {
          setAllContent(shuffleArray(allWords));
        }

        setLoaded(true);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      }
    };

    fetchData();
  }, []);

  // 2. Save progress (only after loading, so we never overwrite with empty data)
  useEffect(() => {
    if (!SAVE_PROGRESS || !loaded || !puzzleDate) return;
    localStorage.setItem(
      "farinha-progress",
      JSON.stringify({ date: puzzleDate, chances, matchedGroups }),
    );
  }, [loaded, puzzleDate, chances, matchedGroups]);

  // 3. Countdown (uses the server's reset time, so no timezone mismatch)
  useEffect(() => {
    if (!gameOver || !nextUpdate) return;

    const tick = () => {
      const diff = Math.max(0, nextUpdate - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff / 60000) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeUntilReset(
        [h, m, s].map((n) => String(n).padStart(2, "0")).join(":"),
      );
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [gameOver, nextUpdate]);

  // 4. End of game: out of lives or all groups found
  useEffect(() => {
    if (!loaded) return;
    if (chances === 0 || matchedGroups.length === 4) {
      setGameOver(true);
      setShowOverlay(true);
    }
  }, [chances, matchedGroups, loaded]);

  // Reveal the groups the player missed when lives run out
  useEffect(() => {
    if (chances === 0 && allContent.length > 0) {
      const revealed = [];
      allContent.forEach((item) => {
        const group = revealed.find((g) => g.title === item.title);
        if (group) group.words.push(item.word);
        else revealed.push({ title: item.title, words: [item.word] });
      });
      setMatchedGroups((prev) => [...prev, ...revealed]);
      setAllContent([]);
    }
  }, [chances, allContent]);

  const handleSquareClick = (index) => {
    if (gameOver || isChecking) return;

    let newSelected = [...selectedSquares];

    if (newSelected.includes(index)) {
      newSelected = newSelected.filter((i) => i !== index);
    } else if (newSelected.length < 4) {
      newSelected.push(index);
    }

    setSelectedSquares(newSelected);

    if (newSelected.length === 4) {
      validateSelection(newSelected);
    }
  };

  const validateSelection = (selected) => {
    const selectedWords = selected.map((i) => allContent[i]);
    const allSameCategory = selectedWords.every(
      (item) => item.title === selectedWords[0].title,
    );

    if (allSameCategory) {
      setMatchedGroups((prev) => [
        ...prev,
        {
          title: selectedWords[0].title,
          words: selectedWords.map((item) => item.word),
        },
      ]);
      setAllContent((prev) => prev.filter((_, i) => !selected.includes(i)));
      setSelectedSquares([]);
    } else {
      setIsChecking(true);
      setErrorFlash([...selected]);
      setTimeout(() => {
        setErrorFlash([]);
        setSelectedSquares([]);
        setChances((prev) => prev - 1);
        setIsChecking(false);
      }, 1000);
    }
  };

  const countdownUI = (
    <div className="timer">
      {timeUntilReset.split(":").map((unit, index) => (
        <div key={index} className="time-unit">
          <span>{unit}</span>
          <small>{["h", "m", "s"][index]}</small>
        </div>
      ))}
    </div>
  );

  return (
    <div className="content">
      <div className="chances-container">
        <h3>Vidas:</h3>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`chance-box ${index < 4 - chances ? "used" : ""}`}
          >
            {index < 4 - chances && <span>❌</span>}
          </div>
        ))}
      </div>

      {matchedGroups.map((group) => (
        <div key={group.title} className="matched-group">
          <p>
            <strong>"{group.title}"</strong>
          </p>
          <p>{group.words.join(", ")}</p>
        </div>
      ))}

      {allContent.length > 0 && !gameOver && (
        <div className="square-grid">
          {allContent.map((item, index) => (
            <div
              key={item.word}
              className={`square ${selectedSquares.includes(index) ? "selected" : ""} ${errorFlash.includes(index) ? "error" : ""}`}
              onClick={() => handleSquareClick(index)}
            >
              {item.word}
            </div>
          ))}
        </div>
      )}

      {gameOver && (
        <div
          className="inline-countdown"
          onClick={() => setShowOverlay(true)}
          style={{ cursor: "pointer" }}
        >
          <div className="countdown-header">
            <span>🕓 Novos temas em:</span>
          </div>
          {countdownUI}
        </div>
      )}

      {showOverlay && (
        <div className="overlay" onClick={() => setShowOverlay(false)}>
          <div className="game-over-overlay">
            <div className="game-over-box">
              <h2>
                {chances === 0
                  ? "😢 Suas tentativas acabaram!"
                  : "🎉 Parabéns! Você venceu! 🎉"}
              </h2>
              <div className="countdown">
                <p>Novos temas em:</p>
                {countdownUI}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Content;
