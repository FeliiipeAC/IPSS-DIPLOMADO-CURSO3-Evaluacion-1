# 🏆 API del Mundial 2026

API REST del Mundial 2026: administra las selecciones del torneo (por grupos y
continentes) y registra los resultados de las semifinales y la final.
Los datos viven en memoria (sin base de datos): al reiniciar el servidor, los
resultados registrados se reinician. Es el comportamiento esperado.

> Evaluación 1 · Módulo 3 (Backend y APIs REST) · Diplomado IPSS

## 🎥 Video demostrativo


## Requisitos

- Node.js 18 o superior

## Cómo levantar el proyecto

```bash
git clone https://github.com/FeliiipeAC/IPSS-DIPLOMADO-CURSO3-Evaluacion-1.git
cd IPSS-DIPLOMADO-CURSO3-Evaluacion-1
npm install
npm run start
```

El servidor queda escuchando en **http://localhost:3000**.

Para desarrollo: `npm run dev` (reinicia solo al guardar, con `node --watch`).

## Cómo probar

Importa `API-Mundial-2026.postman_collection.json` en Postman
(File → Import → arrastra el archivo). Incluye una petición por cada ruta,
con los cuerpos de ejemplo ya cargados en los POST.

## Rutas principales

| Método | Ruta                                     | Descripción                                                           |
| ------ | ---------------------------------------- | --------------------------------------------------------------------- |
| GET    | `/api/selecciones`                       | Todas las selecciones (`?continente=` y `?campeon=true` para filtrar) |
| GET    | `/api/selecciones/:id`                   | Una selección por id                                                  |
| GET    | `/api/copas`                             | Todas las copas del torneo (lista plana)                              |
| GET    | `/api/copas/:seleccion`                  | Las copas de una selección, por nombre                                |
| POST   | `/api/worldcup/2026/semifinals/:n`       | Registrar la semifinal n (1-4)                                        |
| GET    | `/api/worldcup/2026/semifinals`          | Las 4 semifinales                                                     |
| GET    | `/api/worldcup/2026/final`               | La final, con su ganador                                              |
| POST   | `/api/worldcup/2026/final`               | Registrar la final (🌟 el campeón recibe la copa 2026)                |
| GET    | `/api/estadisticas`                      | 📊 Resumen del torneo                                                 |
| GET    | `/api/grupos/:nombre/tabla`              | 🌟 Tabla del grupo por ranking FIFA                                   |
| GET    | `/api/worldcup/2026/camino/:seleccionId` | 🌟 Partidos jugados por una selección                                 |

## Tecnologías

Node.js · Express · CORS
