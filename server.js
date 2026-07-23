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

const buscarContinentePorNombre = (nombre) =>
  continentes.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase());

const buscarSeleccionPorNombre = (nombre) =>
  selecciones.find((s) => s.nombre.toLowerCase() === nombre.toLowerCase());

// -------------------------------------------------------------------------
// 4. Rutas
// -------------------------------------------------------------------------
app.get("/api/selecciones", (req, res) => {
  const { continente, campeon } = req.query;

  let resultado = selecciones;

  if (continente) {
    // Búsqueda anidada: la selección solo guarda continenteId, no el nombre.
    // 1er salto: encontrar el continente por su nombre.
    // 2do salto: filtrar las selecciones por ese id.
    const continenteEncontrado = buscarContinentePorNombre(continente);

    if (!continenteEncontrado) {
      return res
        .status(404)
        .json({ error: `No existe el continente ${continente}` });
    }

    resultado = resultado.filter(
      (s) => s.continenteId === continenteEncontrado.id,
    );
  }

  if (campeon === "true") {
    // Campeona = ganó al menos una copa. El dato es un ARRAY de años:
    // basta con mirar su largo.
    resultado = resultado.filter((s) => s.copas.length > 0);
  }

  res.status(200).json(resultado);
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

// ---- Copas -------------------------------------------------------------

// flatMap: map dejaría 16 arrays anidados; flatMap aplana todo en una sola
// lista. sort ordena la copia nueva, sin tocar los datos originales.
app.get("/api/copas", (req, res) => { // ← NUEVO
  const copas = selecciones.flatMap((s) => s.copas).sort((a, b) => a - b);

  res.status(200).json(copas);
});

app.get("/api/copas/:seleccion", (req, res) => {
  const seleccion = buscarSeleccionPorNombre(req.params.seleccion);

  // "No existe" y "no tiene" son cosas distintas: si la selección no
  // está, 404; si existe pero nunca ganó, 200 con [] (vacío NO es error).
  if (!seleccion) {
    return res
      .status(404)
      .json({ error: `No existe la selección ${req.params.seleccion}` });
  }

  res.status(200).json(seleccion.copas);
});

// -------------------------------------------------------------------------
// 9. Arranque
// -------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`⚽ API del Mundial escuchando en http://localhost:${PORT}`);
});
