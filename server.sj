const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("DS Garage - servidor OAuth online!");
});

app.get("/oauth/callback", (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Código de autorização não recebido.");
  }

  res.send("Autorização recebida com sucesso!");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
