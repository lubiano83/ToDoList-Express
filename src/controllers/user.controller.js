import UserDao from "../dao/user.dao.js";
import SessionDao from "../dao/session.dao.js";
import { createHash, isValidPassword } from "../utils/bcrypt.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const userDao = new UserDao();
const sessionDao = new SessionDao();

export default class UserController {

    getUsers = async( req, res ) => {
        try {
            const paramFilters = req.query;
            const users = await userDao.getUsers( paramFilters );
            return res.status( 200 ).send({ message: "Todos los usuarios", payload: users });
        } catch (error) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    getUserById = async( req, res ) => {
        try {
            const { id } = req.params;
            const user = await userDao.getUserById( id );
            if( !user ) return res.status( 404 ).send({ message: "Ese usuario no existe" });
            return await res.status( 200 ).send({ message: "Un usuario por el id", payload: user });
        } catch ( error ) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    registerUser = async( req, res ) => {
        try {
            const { first_name, last_name, email, password } = req.body;
            if( !first_name || !last_name || !email || !password ) return res.status( 400 ).send({ message: "Todos los campos son obligatorios" });
            const user = await userDao.getUserByProperty({ email });
            if( user.length > 0 ) return res.status( 409 ).send({ message: "Ese email ya esta registrado" });
            if( password.length < 6 || password.length > 8 ) return res.status().send({ message: "La contraseña debe ser entre 6 a 8 caracteres" });
            const payload = await userDao.createUser({ first_name, last_name, email, password: await createHash(password) });
            return res.status( 200 ).send({ message: "Usuario registrado exitosamente", payload });
        } catch (error) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    loginUser = async( req, res ) => {
        try {
            const { email, password } = req.body;
            if( !email || !password ) return res.status( 400 ).send({ message: "Todos los campos son obligatorios" });
            const users = await userDao.getUserByProperty({ email });
            if( users.length === 0 ) return res.status( 409 ).send({ message: "Ese email no esta registrado" });
            const passwordMatch = await isValidPassword(users[0], password);
            if ( !passwordMatch ) return res.status( 401 ).json({ status: 401, message: "La contraseña es incorrecta" });
            const userLogged = req.cookies[ process.env.COOKIE_NAME ];
            if ( userLogged ) return res.status( 200 ).send({ message: "Ese usuario ya está logeado" });
            const token = jwt.sign({ email: users[0].email, first_name: users[0].first_name, last_name: users[0].last_name, category: users[0].category, role: users[0].role, id: users[0]._id.toString() }, process.env.COOKIE_KEY, { expiresIn: "1h" });
            res.cookie( process.env.COOKIE_NAME, token, { maxAge: 3600000, httpOnly: true, secure: true, sameSite: "strict", path: "/" });
            await sessionDao.createSession( users[0]._id, token );
            return res.status( 200 ).json({ message: "Login realizado con éxito", token });
        } catch ( error ) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    logoutUser = async( req, res ) => {
        try {
            const token = req.cookies[process.env.COOKIE_NAME];
            if( !token ) return res.status( 401 ).send({ message: "Token no encontrado, sesión cerrada" });
            res.clearCookie( process.env.COOKIE_NAME, { httpOnly: true, secure: true, sameSite: "strict", path: "/" });
            await sessionDao.deleteSession( token );
            return res.status( 200 ).send({ message: "Logout realizado con exito" });
        } catch ( error ) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    updateUserById = async (req, res) => {
        try {
            const { first_name, last_name } = req.body;
            const { id } = req.params;
            const { filename } = req.file;
            if (!filename) return res.status(400).json({ message: "No se subió ninguna imagen" });
            const originalImagePath = path.join(process.cwd(), "src/public/profile", filename);
            const isWebp = path.extname(filename).toLowerCase() === ".webp";
            let webpFileName = filename;
            let webpImagePath = originalImagePath;
            if (!isWebp) {
                webpFileName = `${path.parse(filename).name}.webp`;
                webpImagePath = path.join(process.cwd(), "src/public/profile", webpFileName);
                await sharp(originalImagePath).webp({ quality: 80 }).toFile(webpImagePath);
                fs.unlinkSync(originalImagePath);
            }
            const newImagePath = `/profile/${webpFileName}`;
            const updateData = { first_name, last_name, image: newImagePath };
            const user = await userDao.getUserById(id);
            if (!user) return res.status(404).json({ message: "Ese usuario no existe" });
            if (user.image) {
                const oldImagePath = path.join(process.cwd(), "src/public", user.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                } else {
                    console.log("La imagen anterior no existe:", oldImagePath);
                }
            }
            const payload = await userDao.updateUserById(id, updateData);
            return res.status(200).json({ message: "Usuario actualizado con éxito", payload });
        } catch (error) {
            return res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    };

    updateRoleById = async ( req, res ) => {
        try {
            const { id } = req.params;
            let { role } = req.body;
            if ( Array.isArray(role )) role = role[0];
            const validRoles = ["slave", "boss", "chief"];
            if ( !role || typeof role !== "string" || !validRoles.includes( role )) return res.status( 400 ).json({ message: `El campo 'role' debe ser uno de los siguientes valores: ${validRoles.join( ", " )}` });
            const payload = await userDao.updateUserById( id, { role });
            return res.status( 200 ).json({ message: "Role actualizado con éxito", payload });
        } catch ( error ) {
            res.status( 500 ).json({ message: "Error interno del servidor", error: error.message });
        }
    };

    deleteUserById = async(req, res) => {
        try {
            const { id } = req.params;
            const user = await userDao.getUserById( id );
            if ( !user ) return res.status( 404 ).json({ message: "Ese usuario no existe" });
            if( user.image ) {
                const imagePath = path.join( process.cwd(), "src/public", user.image );
                if ( fs.existsSync( imagePath )) {
                    fs.unlinkSync( imagePath );
                }
            }
            await userDao.deleteUserById( id );
            return res.status( 200 ).json({ message: "Usuario eliminado con éxito" });
        } catch ( error ) {
            res.status( 500 ).json({ message: "Error interno del servidor", error: error.message });
        }
    };

    usersLogged = async( req, res ) => {
        try {
            const users = await sessionDao.getSessions();
            const usersOnline = users.length;
            return res.status( 200 ).json({ payload: usersOnline });
        } catch ( error ) {
            res.status( 500 ).json({ message: "Error interno del servidor", error: error.message });
        }
    };

    usersRegistered = async( req, res ) => {
        try {
            const users = await userDao.getUsers();
            const usersRegistered = users.length;
            return res.status( 200 ).json({ payload: usersRegistered });
        } catch ( error ) {
            res.status( 500 ).json({ message: "Error interno del servidor", error: error.message });
        }
    };

    getUserFromSession = async ( req, res ) => {
        try {
            const token = req.cookies[process.env.COOKIE_NAME];
            if ( !token ) return res.status( 401 ).json({ message: "No se encontró el token en la cookie" });
            const session = await sessionDao.getUserToken( token );
            if ( !session ) return res.status( 404 ).json({ message: "Sesión no encontrada" });
            return res.status( 200 ).json({ message: "Usuario obtenido desde la sesión", payload: session });
        } catch ( error ) {
            res.status( 500 ).json({ message: "Error interno del servidor", error: error.message });
        }
    };
};