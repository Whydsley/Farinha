const express = require("express");
const cors = require("cors");

const app = express();
const port = 3220;

app.use(cors());
app.use(express.json());

const fs = require("fs");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

const DB_FILE = "./db.json";
const DIFFICULTIES = ["easy", "medium", "hard", "extreme"];
const MIN_VOTES = 10;
const MIN_APPROVAL = 0.75;
const BLOCKED_WORDS = []; // Adicionar palavras proibidas aqui, em minusculo e sem acentos

//----------helpers-----------
const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const shuffle = (arr, rand = Math.random) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const newTheme = (
  { title, content, difficulty },
  status = "pending",
  author = null,
) => ({
  id: crypto.randomUUID(),
  title: title.trim(),
  content: content.map((w) => w.trim()),
  difficulty,
  status, // pending, approved, rejected
  author,
  up: 0,
  down: 0,
  difficultyVotes: [DIFFICULTIES.indexOf(difficulty)],
  voters: [],
  createdAt: new Date().toISOString(),
});

// ------------ storage (JSON file) ------------
const seedThemes = [
  {
    title: "Ingredientes de um bolo",
    content: ["Açucar", "Farinha", "Ovos", "Leite"],
    difficulty: "easy",
  },
  {
    title: "Países da América do Sul",
    content: ["Brasil", "Argentina", "Chile", "Equador"],
    difficulty: "easy",
  },
  {
    title: "Partes de um computador",
    content: ["CPU", "RAM", "GPU", "SSD"],
    difficulty: "medium",
  },
  {
    title: "Redes sociais",
    content: ["Instagram", "Twitter", "Tinder", "Facebook"],
    difficulty: "medium",
  },
  {
    title: "Elementos da tabela periódica",
    content: ["Ouro", "Hidrogênio", "Silício", "Gálio"],
    difficulty: "hard",
  },
  {
    title: "Termos náuticos",
    content: ["Popa", "Casco", "Bombordo", "Timão"],
    difficulty: "hard",
  },
];

const loadDb = () => {
  if (fs.existsSync(DB_FILE))
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  return { themes: seedThemes.map((t) => newTheme(t, "approved")), daily: {} };
};
const db = loadDb();
const saveDb = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
saveDb();

// ----------- daily puzzle: one theme per difficulty -----------
const getDailyThemes = (dateStr) => {
  if (db.daily[dateStr]) return db.daily[dateStr]; // already generated today

  const seed = [...dateStr].reduce((h, c) => h * 31 + c.charCodeAt(0), 7);
  const rand = mulberry32(seed);
  const approved = db.themes.filter((t) => t.status === "approved");
  const chosen = [];
  const usedWords = new Set();

  const tryPick = (candidates) => {
    const pick = candidates.find((t) =>
      t.content.every((w) => !usedWords.has(norm(w))),
    );
    if (pick) {
      chosen.push(pick);
      pick.content.forEach((w) => usedWords.add(norm(w)));
    }
  };

  for (const diff of DIFFICULTIES) {
    tryPick(
      shuffle(
        approved.filter((t) => t.difficulty === diff),
        rand,
      ),
    );
  }

  // if some difficulty has no themes yet, fill with any approved theme
  while (chosen.length < 4) {
    const before = chosen.length;
    tryPick(
      shuffle(
        approved.filter((t) => !chosen.includes(t)),
        rand,
      ),
    );
    if (chosen.length === before) break; // nothing left to add
  }

  const result = chosen.map(({ title, content, difficulty }) => ({
    title,
    content,
    difficulty,
  }));

  db.daily[dateStr] = result;
  saveDb();
  return result;
};

app.get("/daily-themes", (req, res) => {
  const date = getTodayBR();
  res.json({ date, themes: getDailyThemes(date) });
});

// ------------ suggestions ------------
const suggestLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });
const voteLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });

const validateSuggestion = ({ title, content, difficulty, voterId }) => {
  if (typeof voterId !== "string" || voterId.length > 64)
    return "Invalid voterId";
  if (
    typeof title !== "string" ||
    title.trim().length < 3 ||
    title.trim().length > 50
  )
    return "O título precisa ter de 3 a 50 caracteres";
  if (!Array.isArray(content) || content.length !== 4)
    return "Envie exatamente 4 palavras";
  if (
    !content.every(
      (w) =>
        typeof w === "string" && w.trim().length >= 1 && w.trim().length <= 20,
    )
  )
    return "Cada palavra precisa ter de 1 a 20 caracteres";
  if (new Set(content.map(norm)).size !== 4)
    return "As palavras precisam ser únicas";
  if (!DIFFICULTIES.includes(difficulty)) return "Dificuldade inválida";

  const text = [title, ...content].map(norm);
  if (text.some((t) => BLOCKED_WORDS.some((b) => t.includes(b))))
    return "Conteúdo não permitido";

  const words = new Set(content.map(norm));
  const duplicate = db.themes.some(
    (t) =>
      t.status !== "rejected" &&
      (norm(t.title) === norm(title) ||
        t.content.filter((w) => words.has(norm(w))).length >= 3),
  );
  if (duplicate) return "Um tema parecido já existe";
  return null;
};

app.post("/suggestions", suggestLimiter, (req, res) => {
  const error = validateSuggestion(req.body);
  if (error) return res.status(400).json({ error });

  const theme = newTheme(req.body, "pending", req.body.voterId);
  db.themes.push(theme);
  saveDb();
  res.status(201).json({ id: theme.id });
});

// Themes waiting for votes (difficulty hidden so voters aren't influenced)
app.get("/suggestions/pending", (req, res) => {
  const { voterId } = req.query;
  const list = db.themes.filter(
    (t) =>
      t.status === "pending" &&
      t.author !== voterId &&
      !t.voters.includes(voterId),
  );
  res.json(
    shuffle(list)
      .slice(0, 3)
      .map(({ id, title, content }) => ({ id, title, content })),
  );
});

const evaluate = (theme) => {
  const total = theme.up + theme.down;
  if (total < MIN_VOTES) return; // not enough votes yet

  if (theme.up / total >= MIN_APPROVAL) {
    const avg =
      theme.difficultyVotes.reduce((a, b) => a + b, 0) /
      theme.difficultyVotes.length;
    theme.difficulty = DIFFICULTIES[Math.round(avg)];
    theme.status = "approved";
  } else if (theme.down / total > 1 - MIN_APPROVAL) {
    theme.status = "rejected";
  }
};

app.post("/suggestions/:id/vote", voteLimiter, (req, res) => {
  const { voterId, up, difficulty } = req.body;
  const theme = db.themes.find(
    (t) => t.id === req.params.id && t.status === "pending",
  );

  if (!theme) return res.status(404).json({ error: "Tema não encontrado" });
  if (typeof voterId !== "string" || voterId.length > 64)
    return res.status(400).json({ error: "Invalid voter id" });
  if (theme.author === voterId || theme.voters.includes(voterId))
    return res.status(400).json({ error: "Você já votou nesse tema" });

  theme.voters.push(voterId);
  if (up) {
    theme.up++;
    if (DIFFICULTIES.includes(difficulty))
      theme.difficultyVotes.push(DIFFICULTIES.indexOf(difficulty));
  } else {
    theme.down++;
  }

  evaluate(theme);
  saveDb();
  res.json({ status: theme.status });
});

// ----------- admin override (set ADMIN_TOKEN as an enviroment variable) -------------
const requireAdmin = (req, res, next) =>
  process.env.ADMIN_TOKEN &&
  req.headers["x-admin-token"] === process.env.ADMIN_TOKEN
    ? next()
    : res.sendStatus(401);

app.get("/admin/themes", requireAdmin, (req, res) => res.json(db.themes));

app.post("/admin/themes/:id", requireAdmin, (req, res) => {
  const theme = db.themes.find((t) => t.id === req.params.id);
  if (!theme) return res.sendStatus(404);
  if (["approved", "rejected", "pending"].includes(req.body.status))
    theme.status = req.body.status;
  if (DIFFICULTIES.includes(req.body.difficulty))
    theme.difficulty = req.body.difficulty;
  saveDb();
  res.json(theme);
});

// const themePool = [
//   {
//     title: "Ingredientes de um bolo",
//     content: ["Açucar", "Farinha", "Ovos", "Leite"],
//   },
//   {
//     title: "Partes de um computador",
//     content: ["CPU", "RAM", "GPU", "SSD"],
//   },
//   {
//     title: "Países da América do Sul",
//     content: ["Brasil", "Argentina", "Chile", "Equador"],
//   },
//   {
//     title: "Elementos da tabela periódica",
//     content: ["Ouro", "Hidrogênio", "Silício", "Gálio"],
//   },
//   {
//     title: "Redes sociais",
//     content: ["Instagram", "Twitter", "Tinder", "Facebook"],
//   },
//   {
//     title: "Termos náuticos",
//     content: ["Popa", "Casco", "Bombordo", "Timão"],
//   },
// ];

// Função para selecionar 4 temas aleatórios
const mulberry32 = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const getTodayBR = () => {
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
};

app.get("/next-update", (req, res) => {
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const nextUpdate = new Date(next.getTime() + 3 * 60 * 60 * 1000);
  res.json({ nextUpdate: nextUpdate.toISOString() });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// Primeira Array de temas para testar as funcionalidades, deixada aqui como lembrança <3
// app.get("/", (req, res) => {
//   res.json([
//     {
//       id: crypto.randomUUID(),
//       title: "Ingedientes de uma receita de bolo",
//       content: ["Açucar", "Farinha", "Ovos", "Leite"],
//     },
//     {
//       id: crypto.randomUUID(),
//       title: "Animais",
//       content: ["Abelha", "Cachorro", "Coelho", "Urso"],
//     },
//     {
//       id: crypto.randomUUID(),
//       title: "Estilos de artes marciais",
//       content: ["Boxe", "Judô", "Karate", "Kung Fu"],
//     },
//     {
//       id: crypto.randomUUID(),
//       title: "Estilos musicais",
//       content: ["Samba", "Rock", "MPB", "Country"],
//     },
//   ]);
// });
