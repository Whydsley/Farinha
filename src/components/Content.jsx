import { useState, useEffect } from "react";

const Content = () => {
  const [allContent, setAllContent] = useState([]); // Lista de palavras
  const [selectedSquares, setSelectedSquares] = useState([]); // Índices selecionados
  const [matchedGroups, setMatchedGroups] = useState([]); // Grupos encontrados
  const [errorFlash, setErrorFlash] = useState([]); // Índices piscando vermelho
  const [chances, setChances] = useState(4); // Agora são 4 tentativas
  const [gameOver, setGameOver] = useState(false); // Estado de fim de jogo
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    if (chances === 0) {
      // Coletar os temas que ainda não foram descobertos
      const remainingThemes = [];
      const revealedTitles = matchedGroups.map((group) => group.title);

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

      // Adicionar os temas restantes aos grupos descobertos
      setMatchedGroups([...matchedGroups, ...remainingThemes]);

      // Esconder os quadrados e ativar fim de jogo
      setAllContent([]);
      setGameOver(true);
    }
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3220/");
        const jsonData = await response.json();

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          const formattedData = jsonData.flatMap((item) =>
            item.content.map((word) => ({ word, title: item.title }))
          );

          setAllContent(shuffleArray(formattedData));
        } else {
          console.error(
            "Erro: Dados recebidos não são um array válido",
            jsonData
          );
        }
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      }
    };

    fetchData();
  }, []);

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
      const selectedWords = newSelected.map((i) => allContent[i]);
      const allSameCategory = selectedWords.every(
        (item) => item.title === selectedWords[0].title
      );

      if (allSameCategory) {
        setMatchedGroups([
          ...matchedGroups,
          {
            title: selectedWords[0].title,
            words: selectedWords.map((item) => item.word),
          },
        ]);

        const updatedContent = allContent.filter(
          (_, i) => !newSelected.includes(i)
        );
        setAllContent(updatedContent);
        setSelectedSquares([]);

        if (matchedGroups.length + 1 === 4) {
          setGameOver(true);
        }
      } else {
        setErrorFlash([...newSelected]);
        setTimeout(() => {
          setErrorFlash([]);
          setSelectedSquares([]);
          setChances((prev) => prev - 1);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (chances === 0) {
      // Descobrir os temas que ainda não foram encontrados
      const undiscoveredThemes = allContent.reduce((acc, item) => {
        if (chances === 0 || matchedGroups.length === 4) {
          setGameOver(true);
          setGameFinished(true); // Bloqueia o jogo completamente após o fim
        }
        if (!matchedGroups.some((group) => group.title === item.title)) {
          if (!acc.some((group) => group.title === item.title)) {
            acc.push({
              title: item.title,
              words: allContent
                .filter((word) => word.title === item.title)
                .map((word) => word.word),
            });
          }
        }
        return acc;
      }, []);

      setGameOver(true);
    }
  }, [chances, allContent, matchedGroups]);

  return (
    <div className="content">
      {/* Indicador de tentativas restantes */}
      <div className="chances-container">
        <h3>Vidas: </h3>
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
      <div className="matched-groups-container">
        {matchedGroups.map((group, index) => (
          <div key={index} className="matched-group">
            <p>
              <strong>"{group.title}"</strong>
            </p>
            <p>{group.words.join(", ")}</p>
          </div>
        ))}
      </div>
      {/* Quadrados com palavras */}
      {!gameFinished && allContent.length > 0 ? (
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
      ) : null}

      {/* Tela de Fim de Jogo */}
      {gameOver && (
        <div className="overlay" onClick={() => setGameOver(false)}>
          <div className="game-over-overlay">
            <div className="game-over-box">
              {chances === 0 ? (
                <>
                  <h2>😢 Suas tentativas acabaram!</h2>
                  <p>
                    Novos temas estarão disponíveis às 00h00. Tente novamente
                    amanhã!
                  </p>
                </>
              ) : (
                <>
                  <h2>🎉 Parabéns! Você venceu! 🎉</h2>
                  <p>Novos temas estarão disponíveis às 00h00. Volte amanhã!</p>
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
