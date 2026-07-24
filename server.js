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

// Log en vivo: imprime cada petición que llega a la API.
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// -------------------------------------------------------------------------
// 3. Funciones helper
// -------------------------------------------------------------------------

const buscarSeleccionPorId = (id) =>
  selecciones.find((s) => s.id === Number(id));

const buscarContinentePorNombre = (nombre) =>
  continentes.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase());

const buscarSeleccionPorNombre = (nombre) =>
  selecciones.find((s) => s.nombre.toLowerCase() === nombre.toLowerCase());

const buscarSemifinal = (numero) =>
  partidos.semifinales.find((p) => p.numero === numero);

// Valida el cuerpo de un POST de partido. Devuelve el primer error que
// encuentre (texto) o null si todo está bien. Así semifinal y final
// comparten exactamente las mismas reglas.
const validarPartido = (body) => {
  const { local, visita } = body;

  if (
    !local ||
    !visita ||
    local.seleccionId === undefined ||
    local.goles === undefined ||
    visita.seleccionId === undefined ||
    visita.goles === undefined
  ) {
    return "Faltan datos: se requiere local y visita, cada uno con seleccionId y goles";
  }

  if (
    !Number.isInteger(local.seleccionId) ||
    !Number.isInteger(visita.seleccionId)
  ) {
    return "El seleccionId debe ser el id numérico de la selección";
  }

  // Un marcador real es un entero >= 0. Number.isInteger rechaza de una
  // vez textos ("2"), decimales, null y NaN.
  if (
    !Number.isInteger(local.goles) ||
    local.goles < 0 ||
    !Number.isInteger(visita.goles) ||
    visita.goles < 0
  ) {
    return "Los goles deben ser un número entero mayor o igual a 0";
  }

  if (!buscarSeleccionPorId(local.seleccionId)) {
    return `No existe la selección con id ${local.seleccionId}`;
  }

  if (!buscarSeleccionPorId(visita.seleccionId)) {
    return `No existe la selección con id ${visita.seleccionId}`;
  }

  if (local.seleccionId === visita.seleccionId) {
    return "Una selección no puede jugar contra sí misma";
  }

  if (local.goles === visita.goles) {
    return "En un partido de eliminación directa no puede haber empate";
  }

  return null;
};

// El POST recibe IDS, pero el GET responde con NOMBRES: aquí resuelvo
// cada id a su selección (otra búsqueda anidada) y calculo el ganador
// comparando los goles. El ganador NO se guarda: se deduce del marcador.
const partidoConNombres = (titulo, partido) => {
  const local = buscarSeleccionPorId(partido.local.seleccionId);
  const visita = buscarSeleccionPorId(partido.visita.seleccionId);

  return {
    partido: titulo,
    local: { seleccion: local.nombre, goles: partido.local.goles },
    visita: { seleccion: visita.nombre, goles: partido.visita.goles },
    ganador:
      partido.local.goles > partido.visita.goles ? local.nombre : visita.nombre,
  };
};

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
app.get("/api/copas", (req, res) => {
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

// ---- Mundial 2026: semifinales -----------------------------------------

// Las cuatro semifinales, con resultado o marcadas pendientes.
// map transforma la lista fija [1,2,3,4] en otra del mismo largo.
app.get("/api/worldcup/2026/semifinals", (req, res) => {
  const semifinales = [1, 2, 3, 4].map((n) => {
    const semifinal = buscarSemifinal(n);

    return semifinal
      ? partidoConNombres(`semifinal ${n}`, semifinal)
      : { partido: `semifinal ${n}`, estado: "pendiente" };
  });

  res.status(200).json(semifinales);
});

app.get("/api/worldcup/2026/semifinals/:n", (req, res) => {
  const numero = Number(req.params.n);

  // La semifinal 7 no es un recurso que "aún no existe": es un dato que
  // NUNCA podrá ser válido. Por eso 400 (petición mala) y no 404.
  if (!Number.isInteger(numero) || numero < 1 || numero > 4) {
    return res
      .status(400)
      .json({ error: "El número de semifinal debe estar entre 1 y 4" });
  }

  const semifinal = buscarSemifinal(numero);

  if (!semifinal) {
    return res
      .status(404)
      .json({ error: `La semifinal ${numero} aún no se ha jugado` });
  }

  res.status(200).json(partidoConNombres(`semifinal ${numero}`, semifinal));
});

// UNA sola ruta registra las cuatro: el número llega como parámetro.
app.post("/api/worldcup/2026/semifinals/:n", (req, res) => {
  const numero = Number(req.params.n);

  if (!Number.isInteger(numero) || numero < 1 || numero > 4) {
    return res
      .status(400)
      .json({ error: "El número de semifinal debe estar entre 1 y 4" });
  }

  // some responde "¿existe al menos una que cumpla?": la pregunta exacta
  // para detectar un registro duplicado.
  if (partidos.semifinales.some((p) => p.numero === numero)) {
    return res
      .status(400)
      .json({ error: `La semifinal ${numero} ya fue registrada` });
  }

  const errorValidacion = validarPartido(req.body);

  if (errorValidacion) {
    return res.status(400).json({ error: errorValidacion });
  }

  const { local, visita } = req.body;
  const partido = {
    numero,
    local: { seleccionId: local.seleccionId, goles: local.goles },
    visita: { seleccionId: visita.seleccionId, goles: visita.goles },
  };

  partidos.semifinales.push(partido);

  res.status(201).json(partidoConNombres(`semifinal ${numero}`, partido));
});

// ---- Mundial 2026: la final --------------------------------------------

app.get("/api/worldcup/2026/final", (req, res) => {
  if (!partidos.final) {
    return res.status(404).json({ error: "La final aún no se ha jugado" });
  }

  res.status(200).json(partidoConNombres("final", partidos.final));
});

app.post("/api/worldcup/2026/final", (req, res) => {
  // La final se juega UNA vez. Rechazar el re-registro también evita que
  // la copa 2026 pudiera agregarse dos veces al ganador.
  if (partidos.final) {
    return res.status(400).json({ error: "La final ya fue registrada" });
  }

  const errorValidacion = validarPartido(req.body);

  if (errorValidacion) {
    return res.status(400).json({ error: errorValidacion });
  }

  const { local, visita } = req.body;

  partidos.final = {
    local: { seleccionId: local.seleccionId, goles: local.goles },
    visita: { seleccionId: visita.seleccionId, goles: visita.goles },
  };

  // 🌟 Desafío extra: El ganador recibe el año 2026
  // en su array de copas automáticamente.
  const ganador =
    local.goles > visita.goles
      ? buscarSeleccionPorId(local.seleccionId)
      : buscarSeleccionPorId(visita.seleccionId);

  ganador.copas.push(2026);

  res.status(201).json(partidoConNombres("final", partidos.final));
});

// ---- Estadísticas ------------------------------------------------------

// reduce recorre el array acumulando. Con un NÚMERO de partida sirve para
// sumar; con un OBJETO de partida sirve para contar por categoría.
app.get("/api/estadisticas", (req, res) => {
  // Acumulador número: sumo el largo del array de copas de cada selección.
  const totalCopasRepartidas = selecciones.reduce(
    (acc, s) => acc + s.copas.length,
    0,
  );

  // Acumulador objeto: por cada selección resuelvo el NOMBRE de su
  // continente (búsqueda anidada adentro del reduce) y sumo 1 a esa clave.
  const seleccionesPorContinente = selecciones.reduce((acc, s) => {
    const continente = continentes.find((c) => c.id === s.continenteId);
    acc[continente.nombre] = (acc[continente.nombre] || 0) + 1;
    return acc; // ← SIEMPRE devolver el acumulador (el olvido clásico)
  }, {});

  const sumaRankings = selecciones.reduce((acc, s) => acc + s.fifaRanking, 0);

  res.status(200).json({
    totalSelecciones: selecciones.length,
    totalCopasRepartidas,
    seleccionesPorContinente,
    rankingFifaPromedio: sumaRankings / selecciones.length,
  });
});

// ---- Desafíos extra ----------------------------------------------------

// Tabla de posiciones: las selecciones del grupo ordenadas por ranking FIFA.
app.get("/api/grupos/:nombre/tabla", (req, res) => {
  const grupo = grupos.find(
    (g) => g.nombre.toLowerCase() === req.params.nombre.toLowerCase(),
  );

  if (!grupo) {
    return res
      .status(404)
      .json({ error: `No existe el grupo ${req.params.nombre}` });
  }

  // sort muta el array donde trabaja, pero aquí muta la COPIA que devolvió
  // filter: el dataset original queda intacto.
  const tabla = selecciones
    .filter((s) => s.grupoId === grupo.id)
    .sort((a, b) => a.fifaRanking - b.fifaRanking)
    .map((s, indice) => ({
      posicion: indice + 1,
      nombre: s.nombre,
      fifaRanking: s.fifaRanking,
    }));

  res.status(200).json(tabla);
});

// Camino al título: todos los partidos que jugó una selección en el torneo.
app.get("/api/worldcup/2026/camino/:seleccionId", (req, res) => {
  const seleccion = buscarSeleccionPorId(req.params.seleccionId);

  if (!seleccion) {
    return res
      .status(404)
      .json({ error: `No existe la selección ${req.params.seleccionId}` });
  }

  const jugoElPartido = (p) =>
    p.local.seleccionId === seleccion.id ||
    p.visita.seleccionId === seleccion.id;

  const camino = partidos.semifinales
    .filter(jugoElPartido)
    .map((p) => partidoConNombres(`semifinal ${p.numero}`, p));

  if (partidos.final && jugoElPartido(partidos.final)) {
    camino.push(partidoConNombres("final", partidos.final));
  }

  res.status(200).json({ seleccion: seleccion.nombre, partidos: camino });
});

// -------------------------------------------------------------------------
// 8. Ruta no encontrada y manejo de errores
// -------------------------------------------------------------------------

// Si ninguna ruta de arriba respondió, la petición cae aquí: 404 en JSON
// con mensaje claro, en vez de la página de error HTML de Express.
app.use((req, res) => {
  res.status(404).json({ error: `La ruta ${req.originalUrl} no existe` });
});

// Manejador de errores (se reconoce por sus 4 argumentos): atrapa cualquier
// error al procesar una petición y responde JSON en vez de caerse.
// El caso más común: un body con JSON malformado.
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ error: "JSON inválido en el cuerpo de la petición" });
  }

  res.status(400).json({ error: "Petición inválida" });
});

// -------------------------------------------------------------------------
// 9. Arranque
// -------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`⚽ API del Mundial escuchando en http://localhost:${PORT}`);
});
