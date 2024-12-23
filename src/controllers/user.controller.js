import UserDao from "../dao/user.dao.js"
import { createHash, isValidPassword } from "../utils/bcrypt.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const userDao = new UserDao();

export default class UserController {

    getUsers = async( req, res ) => {
        try {
            const users = await userDao.getUsers();
            return res.status(200).send({ message: "Todos los usuarios", payload: users });
        } catch (error) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    getUserById = async( req, res ) => {
        try {
            const { id } = req.params;
            const user = await userDao.getUserById( id );
            if( !user ) return res.status(404).send({ message: "Ese usuario no existe" });
            return await res.status(200).send({ message: "Un usuario por el id", payload: user });
        } catch (error) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    getUserByEmail = async( req, res ) => {
        try {
            const { email } = req.params;
            const user = await userDao.getUserByEmail({ email });
            if( !user ) return res.status(404).send({ message: "Ese usuario no existe" });
            return res.status(200).send({ message: "Un usuario por el email", payload: user });
        } catch (error) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    registerUser = async( req, res ) => {
        try {
            const { first_name, last_name, email, password } = req.body;
            if( !first_name || !last_name || !email || !password ) return res.status(400).send({ message: "Todos los campos son obligatorios" });
            const user = await userDao.getUserByEmail({ email });
            if( user ) return res.status(409).send({ message: "Ese email ya esta registrado" });
            if( password.lenght < 6 || password.lenght > 8 ) return res.status().send({ message: "La contraseña debe ser entre 6 a 8 caracteres" });
            const payload = await userDao.createUser({ first_name, last_name, email, password: await createHash(password) });
            return res.status(200).send({ message: "Usuario registrado exitosamente", payload });
        } catch (error) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    loginUser = async( req, res ) => {
        try {
            const { email, password } = req.body;
            if( !email || !password ) return res.status(400).send({ message: "Todos los campos son obligatorios" });
            const user = await userDao.getUserByEmail({ email });
            // if( !user ) return res.status(409).send({ message: "Ese email no esta registrado" });
            const passwordMatch = await isValidPassword(user, password);
            if (!passwordMatch) return res.status(401).json({ status: 401, message: "La contraseña es incorrecta" });
            const userLogged = req.cookies[process.env.COOKIE_NAME];
            if (userLogged) return res.status(200).send({ message: "Ese usuario ya está logeado" });
            const token = jwt.sign({ email: user.email, first_name: user.first_name, last_name: user.last_name, category: user.category, role: user.role, id: user._id.toString() }, process.env.COOKIE_KEY, { expiresIn: "1h" });
            res.cookie(process.env.COOKIE_NAME, token, { maxAge: 3600000, httpOnly: true, secure: true, sameSite: "strict", path: "/" });
            return res.status(200).json({ message: "Login realizado con éxito", token });
        } catch (error) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    logoutUser = async( req, res ) => {
        try {
            const token = req.cookies[process.env.COOKIE_NAME];
            if( !token ) return res.status(401).send({ message: "Token no encontrado, sesión cerrada" });
            res.clearCookie(process.env.COOKIE_NAME, { httpOnly: true, secure: true, sameSite: "strict", path: "/" });
            return res.status(200).send({ message: "Logout realizado con exito" });
        } catch (error) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    updateUserById = async(req, res) => {
        try {
            const { first_name, last_name } = req.body;
            const { id } = req.params;
            const { filename } = req.file;
            if (!filename) return res.status(400).json({ message: "No se subió ninguna imagen" });
            const newImagePath = `/profile/${filename}`;
            const updateData = { first_name, last_name, image: newImagePath };
            const user = await userDao.getUserById( id );
            if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
            if (user.image) {
                const oldImagePath = path.join(process.cwd(), "src/public", user.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Imagen anterior eliminada correctamente.");
                } else {
                    console.log("La imagen anterior no existe:", oldImagePath);
                }
            }
            const payload = await userDao.updateUserById(id, updateData);
            return res.status(200).json({ message: "Usuario actualizado con éxito", payload });
        } catch (error) {
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    };

    updateRoleById = async (req, res) => {
        try {
            const { id } = req.params;
            let { role } = req.body;
            if (Array.isArray(role)) role = role[0];
            const validRoles = ["slave", "boss", "chief"];
            if (!role || typeof role !== "string" || !validRoles.includes(role)) return res.status(400).json({ message: `El campo 'role' debe ser uno de los siguientes valores: ${validRoles.join(", ")}` });
            const payload = await userDao.updateUserById(id, { role });
            return res.status(200).json({ message: "Role actualizado con éxito", payload });
        } catch (error) {
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    };
    
};