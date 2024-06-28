require('dotenv').config();
const express = require("express");
const helmet = require("helmet");
const path = require("path");

const app = express();
const port = process.env.PORT || 3001;
const allowedOrigin = process.env.ALLOWED_ORIGIN;
const apiUrl = process.env.API_URL;

// Middleware de seguridad con Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "https://cdn.socket.io"],
        "connect-src": ["'self'", apiUrl, apiUrl.replace('https', 'wss')],
        "img-src": ["'self'", "data:", "https:"],
      },
    },
  })
);

// Middleware para habilitar CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, "public")));

// Ruta para servir la página web
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/config", (req, res) => {
  res.json({
    apiUrl: apiUrl,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Error interno del servidor.');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
