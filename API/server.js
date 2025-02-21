const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const port = 3220;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json([
    {
      id: crypto.randomUUID(),
      title: "Ingedientes de uma receita de bolo",
      content: ["Açucar", "Farinha", "Ovos", "Leite"],
    },
    {
      id: crypto.randomUUID(),
      title: "Animais",
      content: ["Abelha", "Cachorro", "Coelho", "Urso"],
    },
    {
      id: crypto.randomUUID(),
      title: "Estilos de artes marciais",
      content: ["Boxe", "Judô", "Karate", "Kung Fu"],
    },
    {
      id: crypto.randomUUID(),
      title: "Estilos musicais",
      content: ["Samba", "Rock", "MPB", "Country"],
    },
  ]);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
