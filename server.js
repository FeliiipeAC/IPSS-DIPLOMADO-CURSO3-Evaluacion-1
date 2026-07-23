import express from 'express'
import cors from 'cors'
import { continentes, grupos, selecciones, partidos } from './datos-mundial.js'

// -------------------------------------------------------------------------
// 1. Configuración
// -------------------------------------------------------------------------

const PORT = 3000

// Configuración de CORS en un solo lugar (la modifico en vivo en el video):
// origin '*'  → acepta peticiones desde cualquier origen
// methods     → los verbos que un navegador puede usar contra la API
const OPCIONES_CORS = {
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
}

const app = express()

// -------------------------------------------------------------------------
// 2. Middlewares
// -------------------------------------------------------------------------

app.use(cors(OPCIONES_CORS))
app.use(express.json()) // transforma el cuerpo de las peticiones en JSON

// -------------------------------------------------------------------------
// 3. Funciones helper
// -------------------------------------------------------------------------

// -------------------------------------------------------------------------
// 4. Rutas
// -------------------------------------------------------------------------

// -------------------------------------------------------------------------
// 9. Arranque
// -------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`⚽ API del Mundial escuchando en http://localhost:${PORT}`)
})