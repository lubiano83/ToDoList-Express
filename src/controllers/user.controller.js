import UserDao from "../dao/user.dao.js";
import SessionDao from "../dao/session.dao.js";
import { createHash, isValidPassword } from "../utils/bcrypt.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import moment from "moment"

const userDao = new UserDao();
const sessionDao = new SessionDao();

export default class UserController {

    getUsers = async( req, res ) => {
        try {
            const paramFilters = req.query;
            const users = await userDao.getUsers( paramFilters );
            return res.status( 200 ).json({ message: "Todos los usuarios", payload: users });
        } catch (error) {
            res.status( 500 ).json({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    getUserById = async (req, res) => {
        try {
            const id = req.user.id;
            const user = await userDao.getUserById(id);
            if (!user) return res.status(404).json({ message: "Ese usuario no existe" });
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            user.image = `${baseUrl}${user.image}`;
            return res.status(200).json({ message: "Un usuario por el id", payload: user });
        } catch (error) {
            res.status(500).json({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };    
    
    registerUser = async (req, res) => {
        try {
            const { first_name, last_name, email, password } = req.body;
            if (!first_name || !last_name || !email || !password) return res.status(400).json({ message: "Todos los campos son obligatorios" });
            const existingUser = await userDao.getUserByProperty({ email: email.toLowerCase() });
            if (existingUser.length > 0) return res.status(409).json({ message: "Ese email ya está registrado" });
            if (password.length < 6 || password.length > 8) return res.status(400).json({ message: "La contraseña debe tener entre 6 y 8 caracteres" });
            const defaultImage = "/profile-circle-svgrepo-com.webp";
            const newUser = {
                first_name: first_name.toLowerCase(),
                last_name: last_name.toLowerCase(),
                email: email.toLowerCase(),
                password: await createHash(password),
                image: defaultImage,
            };
            const payload = await userDao.createUser(newUser);
            return res.status(200).json({ message: "Usuario registrado exitosamente", payload });
        } catch (error) {
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    };    

    loginUser = async( req, res ) => {
        try {
            const { email, password } = req.body;
            if( !email || !password ) return res.status( 400 ).send({ message: "Todos los campos son obligatorios" });
            const users = await userDao.getUserByProperty({ email: email.toLowerCase() });
            if( users.length === 0 ) return res.status( 409 ).json({ message: "Ese email no esta registrado" });
            const passwordMatch = await isValidPassword(users[0], password);
            if ( !passwordMatch ) return res.status( 401 ).json({ status: 401, message: "La contraseña es incorrecta" });
            const userLogged = req.cookies[ process.env.COOKIE_NAME ];
            if ( userLogged ) return res.status( 200 ).send({ message: "Ese usuario ya está logeado" });
            const token = jwt.sign({ email: users[0].email.toLowerCase(), first_name: users[0].first_name.toLowerCase(), last_name: users[0].last_name.toLowerCase(), category: users[0].category.toLowerCase(), role: users[0].role.toLowerCase(), id: users[0]._id.toString() }, process.env.COOKIE_KEY, { expiresIn: "1h" });
            res.cookie( process.env.COOKIE_NAME, token, { maxAge: 3600000, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "none", path: "/" });
            await sessionDao.createSession( users[0]._id, token );
            return res.status( 200 ).json({ message: "Login realizado con éxito", token });
        } catch ( error ) {
            res.status( 500 ).json({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    logoutUser = async (req, res) => {
        try {
            const token = req.cookies[process.env.COOKIE_NAME];
            if (!token) return res.status(401).send({ message: "Token no encontrado, sesión cerrada" });
            res.clearCookie(process.env.COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "none", path: "/" });
            await sessionDao.deleteSession(token);
            return res.status(200).json({ message: "Logout realizado con éxito" });
        } catch (error) {
            res.status(500).json({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };    

    updateUserById = async (req, res) => {
        try {
            const { first_name, last_name } = req.body;
            const { id } = req.user;
            const filename = req.file?.filename;
            const user = await userDao.getUserById(id);
            if (!user) return res.status(404).json({ message: "Ese usuario no existe" });
            const updateData = {};
            if (first_name) updateData.first_name = first_name.toLowerCase();
            if (last_name) updateData.last_name = last_name.toLowerCase();
            if (filename) {
                updateData.image = `/profile/${filename}`;
                if (user.image && user.image !== "/profile-circle-svgrepo-com.webp") {
                    const oldImagePath = path.join(process.cwd(), "src/public", user.image);
                    if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
                }
            }
            const updatedUser = await userDao.updateUserById(id, updateData);
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            const fullImageUrl = updatedUser.image ? `${baseUrl}${updatedUser.image}` : null;
            return res.status(200).json({
                message: "Usuario actualizado con éxito",
                payload: {
                    ...updatedUser.toObject(),
                    image: fullImageUrl,
                },
            });
        } catch (error) {
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
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

    updateCategoryById = async ( req, res ) => {
        try {
            const { id } = req.params;
            let { category } = req.body;
            const payload = await userDao.updateUserById( id, { category });
            return res.status( 200 ).json({ message: "Categoria actualizada con éxito", payload });
        } catch ( error ) {
            res.status( 500 ).json({ message: "Error interno del servidor", error: error.message });
        }
    };

    removeUserFromTeam = async (req, res) => {
        try {
            const { email } = req.params;
            const id = req.user.id;
            const deletedUser = await userDao.getUserByProperty({ email: email.toLowerCase() });
            const loggedUser = await userDao.getUserById(id);
            if (!loggedUser) return res.status(404).json({ message: "Usuario logueado no encontrado" });
            const userInTeam = loggedUser.team.find(item => item.id.toString() === deletedUser[0]._id.toString());
            if(!userInTeam) return res.status(404).send({ message: "Ese usuario no pertenece a tu equipo.." })
            const updatedTeam = loggedUser.team.filter((item) => item.id.toString() !== deletedUser[0]._id.toString());
            await userDao.updateUserById(loggedUser._id, { team: updatedTeam });
            await userDao.updateUserById( deletedUser[0]._id, { role: "chief", company: "" });
            return res.status(200).json({ message: "Usuario removido del equipo con éxito" });
        } catch (error) {
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    };

    leaveTheTeam = async (req, res) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const teamLeader = await userDao.getUserById(id);
            if(!teamLeader) return res.status(404).send({ message: "Ese equipo no existe" })
            const user = await userDao.getUserById(userId);
            if (!user) return res.status(404).send({ message: "Usuario no encontrado" });
            const isMemberOfTeam = teamLeader.team.find(item => item.id.toString() === user._id.toString());
            if (!isMemberOfTeam) return res.status(400).json({ message: "No perteneces a este equipo" });
            await userDao.updateUserById(teamLeader._id, { team: teamLeader.team.filter(item => item.id.toString() !== userId) });
            await userDao.updateUserById(userId, { role: "chief", company: ""});
            return res.status(200).json({ message: "Has dejado el equipo con éxito" });
        } catch (error) {
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    };    

    addUserToTeam = async (req, res) => {
        try {
            const { email } = req.params;
            const id = req.user.id;
            const loggedUser = await userDao.getUserById(id);
            if (!loggedUser) return res.status(404).json({ message: "Usuario logueado no encontrado" });
            const invitedUser = await userDao.getUserByProperty({ email: email.toLowerCase() });
            if (!invitedUser || invitedUser.length === 0) return res.status(404).json({ message: "El usuario con ese email no existe" });
            const invitedUserData = invitedUser[0];
            if(id === invitedUserData._id.toString()) return res.status(200).send({ message: "No te puedes invitar a ti.." })
            if (invitedUserData.invitations.find(invite => invite.teamId.toString() === loggedUser._id.toString())) return res.status(400).json({ message: "Ya existe una invitación pendiente para este usuario" });
            const newInvitation = {
                teamId: loggedUser._id,
                teamName: `${loggedUser.first_name} ${loggedUser.last_name}`,
                teamEmail: loggedUser.email,
                date: moment().format("DD/MM/YYYY"),
            };
            await userDao.updateUserById(invitedUserData._id, { invitations: [...invitedUserData.invitations, newInvitation] });
            return res.status(200).json({ message: `Invitación enviada a ${email} con éxito` });
        } catch (error) {
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    };

    acceptInvitation = async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const user = await userDao.getUserById(userId);
            if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
            const invitation = user.invitations.find(item => item.teamId.toString() === id);
            if (!invitation) return res.status(404).json({ message: "Invitación no encontrada" });
            const teamLeader = await userDao.getUserById(id);
            const userCompany = {
                companyId: teamLeader._id,
                companyName: `${teamLeader.first_name} ${teamLeader.last_name}`,
                companyEmail: teamLeader.email,
                date: moment().format("DD/MM/YYYY"),
            };
            if (!teamLeader) return res.status(404).json({ message: "El equipo no existe" });
            await userDao.updateUserById(teamLeader._id, { team: [ ...teamLeader.team, { id: user._id, image: user.image } ]});
            const updatedUser = await userDao.updateUserById(user._id, { invitations: user.invitations.filter(invite => invite.teamId.toString() !== id), role: "slave", company: userCompany });
            return res.status(200).json({ message: "Invitación aceptada con éxito", payload: updatedUser });
        } catch (error) {
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    };
    
    rejectInvitation = async(req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const user = await userDao.getUserById(userId);
            console.log(user);
            if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
            const invitationExists = user.invitations.find(item => item.teamId.toString() === id);
            if (!invitationExists) return res.status(404).json({ message: "Invitación no encontrada" });
            const updatedUser = await userDao.updateUserById(user._id.toString(), {
                invitations: user.invitations.filter(invite => invite.teamId.toString() !== id),
            });
            return res.status(200).json({ message: "Invitación rechazada con éxito", payload: updatedUser });
        } catch (error) {
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    };    
};