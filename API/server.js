const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const schedule = require("node-schedule");

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

// Variável que seleciona os temas do dia
let currentThemes = [];

// Função para selecionar 4 temas aleatórios
const refreshThemes = () => {
  const shuffled = [...themePool].sort(() => 0.5 - Math.random());
  currentThemes = shuffled.slice(0, 4);
  console.log("Temas atualizados em: ", new Date().toLocaleString());
  console.log(currentThemes.map((t) => t.title));
};

// Agendar atualização para 00:00
const job = schedule.scheduleJob("0 0 * * *", refreshThemes);

// Atualizar ao iniciar o servidor, bom para eviar problemas
refreshThemes();

// Rota para obter os temas do dia
app.get("/daily-themes", (req, res) => {
  res.json(currentThemes);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.get("/next-update", (req, res) => {
  res.json({
    nextUpdate: job.nextInvocation().toISOString(),
  });
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
