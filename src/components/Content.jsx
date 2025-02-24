import { useState, useEffect } from "react";

const Content = () => {
  const [allContent, setAllContent] = useState([]); // Palavras disponíveis
  const [selectedSquares, setSelectedSquares] = useState([]); // Índices selecionados
  const [matchedGroups, setMatchedGroups] = useState([]); // Temas encontrados
  const [errorFlash, setErrorFlash] = useState([]); // Índices piscando vermelho
  const [chances, setChances] = useState(4); // Tentativas restantes
  const [gameOver, setGameOver] = useState(false); // Estado de fim de jogo
  const [timeUntilReset, setTimeUntilReset] = useState(""); // Contador até 00:00
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3220/daily-themes");
        const jsonData = await response.json();

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          const formattedData = jsonData.flatMap((item) =>
            item.content.map((word) => ({ word, title: item.title }))
          );
          setAllContent(shuffleArray(formattedData));
        } else {
          console.error("Erro: Dados inválidos", jsonData);
        }
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      }
    };

    fetchData();
  }, []);

  // Função para calcular o timer
  const calculateTimeUntilReset = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Próximas 00:00

    const diff = midnight - now;

    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Atualizar contador
  useEffect(() => {
    if (gameOver || showCountdown) {
      const timer = setInterval(() => {
        setTimeUntilReset(calculateTimeUntilReset());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameOver, showCountdown]);

  // Função para embaralhar a array
  const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

  const handleSquareClick = (index) => {
    if (gameOver || matchedGroups.length === 4) return;

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

  const handleCountdownClick = () => {
    if (showCountdown) {
      setGameOver(true);
    }
  };

  const validateSelection = (selected) => {
    const selectedWords = selected.map((i) => allContent[i]);
    const allSameCategory = selectedWords.every(
      (item) => item.title === selectedWords[0].title
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

      if (matchedGroups.length + 1 === 4) {
        setGameOver(true);
      }
    } else {
      setErrorFlash([...selected]);
      setTimeout(() => {
        setErrorFlash([]);
        setSelectedSquares([]);
        setChances((prev) => prev - 1);
      }, 1000);
    }
  };

  // Se as chances acabaram, revelar todos os temas e encerrar o jogo
  useEffect(() => {
    if (chances === 0 || matchedGroups.length === 4) {
      setGameOver(true);
      setShowCountdown(true);

      if (allContent.length > 0) {
        revealRemainingThemes();
      }
    }
  }, [chances, matchedGroups]);

  const revealRemainingThemes = () => {
    const revealedTitles = matchedGroups.map((group) => group.title);
    const remainingThemes = [];

    allContent.forEach((item) => {
      if (!revealedTitles.includes(item.title)) {
        const existingGroup = remainingThemes.find(
          (g) => g.title === item.title
        );
        if (existingGroup) {
          existingGroup.words.push(item.word);
        } else {
          remainingThemes.push({ title: item.title, words: [item.word] });
        }
      }
    });

    setMatchedGroups((prev) => [...prev, ...remainingThemes]);
    setAllContent([]); // Remove todas as palavras da tela
    setGameOver(true);
  };

  return (
    <div className="content">
      {/* Indicador de tentativas restantes */}
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

      {/* Grupos já encontrados */}
      {matchedGroups.map((group, index) => (
        <div key={index} className="matched-group">
          <p>
            <strong>"{group.title}"</strong>
          </p>
          <p>{group.words.join(", ")}</p>
        </div>
      ))}

      {/* Quadrados com palavras */}
      {allContent.length > 0 && !gameOver && (
        <div className="square-grid">
          {allContent.map((item, index) => (
            <div
              key={index}
              className={`square 
                ${selectedSquares.includes(index) ? "selected" : ""} 
                ${errorFlash.includes(index) ? "error" : ""}`}
              onClick={() => handleSquareClick(index)}
            >
              {item.word}
            </div>
          ))}
        </div>
      )}

      {/* Contador abaixo dos quadrados */}
      {showCountdown && (
        <div
          className="inline-countdown"
          onClick={handleCountdownClick}
          style={{ cursor: gameOver ? "default" : "pointer" }}
        >
          <div className="countdown-header">
            <span>🕓 Novos temas em:</span>
          </div>
          <div className="timer">
            {timeUntilReset.split(":").map((unit, index) => (
              <div key={index} className="time-unit">
                <span>{unit}</span>
                <small>{["h", "m", "s"][index]}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tela de Fim de Jogo */}
      {gameOver && (
        <div className="overlay" onClick={() => setGameOver(false)}>
          <div className="game-over-overlay">
            <div className="game-over-box">
              {chances === 0 ? (
                <>
                  <h2>😢 Suas tentativas acabaram!</h2>
                  <div className="countdown">
                    <p>Novos temas em:</p>
                    <div className="timer">
                      {timeUntilReset.split(":").map((unit, index) => (
                        <div key={index} className="time-unit">
                          <span>{unit}</span>
                          <small>{["h", "m", "s"][index]}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2>🎉 Parabéns! Você venceu! 🎉</h2>
                  <div className="countdown">
                    <p>Novos temas em:</p>
                    <div className="timer">
                      {timeUntilReset.split(":").map((unit, index) => (
                        <div key={index} className="time-unit">
                          <span>{unit}</span>
                          <small>{["h", "m", "s"][index]}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Content;
