import express from "express";
import cors from "cors";
import todoRouter from "./routes/todo.router.js";
import userRouter from "./routes/user.router.js";
import sessionRouter from "./routes/session.router.js";
import teamRouter from "./routes/team.router.js";
import cookieParser from "cookie-parser";
import passport from "passport";
import initializePassport from "./config/passport.config.js";
import { fileURLToPath } from "url";
import path from "path";

// Variables
const APP = express();
const PORT = 8080;
const HOST = "localhost";

// Define manualmente __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
APP.use(express.json());
APP.use(express.urlencoded({ extended: true }));
APP.use(cookieParser());
APP.use(passport.initialize());
initializePassport();

// Servir imágenes desde la carpeta public
APP.use("/", express.static(path.join(process.cwd(), "src/public")));

// Servir imágenes personalizadas desde la carpeta public/profile
APP.use("/profile", express.static(path.join(process.cwd(), "src/public/profile")));

// Configuración de CORS
APP.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8081', 'http://192.168.20.61:8081'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    credentials: true, // Permitir cookies
}));

// Rutas
APP.use("/api/todos", todoRouter);
APP.use("/api/users", userRouter);
APP.use("/api/auths", sessionRouter);
APP.use("/api/teams", teamRouter);

// Método que gestiona las rutas inexistentes.
APP.use("*", (req, res) => {
    return res.status(404).send("<h1>Error 404: Not Found</h1>");
});

// Control de errores internos
APP.use((error, req, res, next) => {
    console.error("Error:", error.message);
    res.status(500).send("<h1>Error 500: Error en el Servidor</h1>");
});

// Listen
APP.listen(PORT, () => console.log(`Escuchando en http://${HOST}:${PORT}`));