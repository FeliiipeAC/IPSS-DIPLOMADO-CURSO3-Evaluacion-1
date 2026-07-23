import express from "express";
import cors from "cors";
import { continentes, grupos, selecciones, partidos } from "./datos-mundial.js";

// -------------------------------------------------------------------------
// 1. Configuración
// -------------------------------------------------------------------------

const PORT = 3000;

// Configuración de CORS en un solo lugar (la modifico en vivo en el video):
// origin '*'  → acepta peticiones desde cualquier origen
// methods     → los verbos que un navegador puede usar contra la API
const OPCIONES_CORS = {
  origin: "*",
  methods: ["GET", "POST", "DELETE"],
};

const app = express();

// -------------------------------------------------------------------------
// 2. Middlewares
// -------------------------------------------------------------------------

app.use(cors(OPCIONES_CORS));
app.use(express.json()); // transforma el cuerpo de las peticiones en JSON

// -------------------------------------------------------------------------
// 3. Funciones helper
// -------------------------------------------------------------------------

const buscarSeleccionPorId = (id) =>
  selecciones.find((s) => s.id === Number(id));

// -------------------------------------------------------------------------
// 4. Rutas
// -------------------------------------------------------------------------

app.get("/api/selecciones", (req, res) => {
  res.status(200).json(selecciones);
});

app.get("/api/selecciones/:id", (req, res) => {
  const seleccion = buscarSeleccionPorId(req.params.id);

  if (!seleccion) {
    return res
      .status(404)
      .json({ error: `No existe la selección ${req.params.id}` });
  }

  res.status(200).json(seleccion);
});

// -------------------------------------------------------------------------
// 9. Arranque
// -------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`⚽ API del Mundial escuchando en http://localhost:${PORT}`);
});
