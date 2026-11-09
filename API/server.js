const express = require("express");
const cors = require("cors");

const app = express();
const port = 3220;

app.use(cors());
app.use(express.json());

const themePool = [
  {
    title: "Ingredientes de um bolo",
    content: ["Açucar", "Farinha", "Ovos", "Leite"],
  },
  {
    title: "Partes de um computador",
    content: ["CPU", "RAM", "GPU", "SSD"],
  },
  {
    title: "Países da América do Sul",
    content: ["Brasil", "Argentina", "Chile", "Equador"],
  },
  {
    title: "Elementos da tabela periódica",
    content: ["Ouro", "Hidrogênio", "Silício", "Gálio"],
  },
  {
    title: "Redes sociais",
    content: ["Instagram", "Twitter", "Tinder", "Facebook"],
  },
  {
    title: "Termos náuticos",
    content: ["Popa", "Casco", "Bombordo", "Timão"],
  },
];

// Função para selecionar 4 temas aleatórios
const mulberry32 = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const getDailyThemes = (dateStr) => {
  const seed = [...dateStr].reduce((h, c) => h * 31 + c.charCodeAt(0), 7);
  const rand = mulberry32(seed);
  const arr = [...themePool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 4);
};

const getTodayBR = () => {
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
};

app.get("/daily-themes", (req, res) => {
  const date = getTodayBR();
  res.json({ date, themes: getDailyThemes(date) });
});

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
