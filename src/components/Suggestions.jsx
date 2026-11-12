import { useState, useEffect } from "react";

const API_URL = "http://localhost:3220";

const LEVELS = [
  ["easy", "Fácil"],
  ["medium", "Média"],
  ["hard", "Difícil"],
  ["extreme", "Extrema"],
];

// Annonymous ID saved in the browser, used to prevent double voting
const getVoterId = () => {
  let id = localStorage.getItem("farinha-voter");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("farinha-voter", id);
  }
  return id;
};

const post = (url, body) =>
  fetch(`${API_URL}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, voterId: getVoterId() }),
  });

// Form to send a new theme (used in the footer popup)

export const SuggestTheme = () => {
  const [title, setTitle] = useState("");
  const [words, setWords] = useState(["", "", "", ""]);
  const [difficulty, setDifficulty] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await post("/suggestions", {
        title,
        content: words,
        difficulty,
      });
      const data = await res.json();

      if (res.ok) {
        setMessage("Obrigado! Sua sugestão vai para votação 🎉");
        setTitle("");
        setWords(["", "", "", ""]);
        setDifficulty("");
      } else {
        setMessage(data.error || "Algo deu errado");
      }
    } catch {
      setMessage("Não foi possível conectar ao servidor");
    }
  };

  return (
    <form className="suggest-form" onSubmit={submit}>
      <h3>Sugira um tema</h3>
      <input
        placeholder="Título (ex: Frutas Vermelhas)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      {words.map((w, i) => (
        <input
          key={i}
          placeholder={`Palavra ${i + 1}`}
          value={w}
          onChange={(e) =>
            setWords(words.map((x, j) => (j === i ? e.target.value : x)))
          }
        ></input>
      ))}
      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        required
      >
        <option value="" disabled hidden>
          Selecione uma dificuldade para o tema
        </option>
        {LEVELS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button type="submit">Enviar</button>
      {message && <p>{message}</p>}
    </form>
  );
};

// Cards to vote on pending themes (used in game component)
export const VoteThemes = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState({}); // difficulty chosen per theme id

  useEffect(() => {
    fetch(`${API_URL}/suggestions/pending?voterId=${getVoterId()}`)
      .then((r) => r.json())
      .then(setPending)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const vote = async (id, up) => {
    await post(`/suggestions/${id}/vote`, {
      up,
      difficulty: levels[id] || "medium",
    });
    setPending((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="vote-themes">
      <h3>Ajude a avaliar novos temas</h3>

      {pending.length === 0 && (
        <p>Nenhum tema para votar agora. Volte mais tarde!</p>
      )}

      {pending.map((t) => (
        <div key={t.id} className="vote-card">
          <strong>{t.title}</strong>
          <p>{t.content.join(", ")}</p>
          <select
            value={levels[t.id] || "medium"}
            onChange={(e) => setLevels({ ...levels, [t.id]: e.target.value })}
          >
            {LEVELS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button onClick={() => vote(t.id, true)}>👍</button>
          <button onClick={() => vote(t.id, false)}>👎</button>
        </div>
      ))}
    </div>
  );
};
