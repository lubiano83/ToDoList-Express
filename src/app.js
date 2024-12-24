import express from "express";
import cors from "cors";
import todoRouter from "./routes/todo.router.js";
import userRouter from "./routes/user.router.js";
import cookieParser from "cookie-parser";
import passport from "passport";
import initializePassport from "./config/passport.config.js";

// Variables
const APP = express();
const PORT = 8080;
const HOST = "localhost";

// Middlewares
APP.use(express.json());
APP.use(express.urlencoded({ extended: true }));
APP.use(cookieParser());
APP.use(passport.initialize());
initializePassport();

// Configuración de CORS
APP.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    credentials: true
}));

// Rutas
APP.use("/api/todos", todoRouter);
APP.use("/api/users", userRouter);

// Método que gestiona las rutas inexistentes.
APP.use("*", (req, res) => {
    return res.status(404).send("<h1>Error 404: Not Found</h1>");
});

// Control de errores internos
APP.use((error, req, res) => {
    console.error("Error:", error.message);
    res.status(500).send("<h1>Error 500: Error en el Servidor</h1>");
});

// Listen
APP.listen(PORT, () => console.log(`Escuchando en http://${HOST}:${PORT}`));