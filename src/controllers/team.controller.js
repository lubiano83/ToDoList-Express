import UserDao from "../dao/user.dao.js";
import moment from "moment";

const userDao = new UserDao();

export default class TeamController {
    updateRoleById = async ( req, res ) => {
        try {
            let { id, role } = req.body;
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
            let { id, category } = req.body;
            const payload = await userDao.updateUserById( id, { category });
            return res.status( 200 ).json({ message: "Categoria actualizada con éxito", payload });
        } catch ( error ) {
            res.status( 500 ).json({ message: "Error interno del servidor", error: error.message });
        }
    };

    removeUserFromTeam = async (req, res) => {
        try {
            const { email } = req.body;
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
            const user = await userDao.getUserById(userId);
            if (!user) return res.status(404).send({ message: "Usuario no encontrado.." });
            const teamLeader = await userDao.getUserById(user.company.companyId);
            if(!teamLeader) return res.status(404).send({ message: "Ese equipo no existe.." })
            const isMemberOfTeam = teamLeader.team.find(item => item.id.toString() === user._id.toString());
            if (!isMemberOfTeam) return res.status(400).json({ message: "No perteneces a este equipo.." });
            await userDao.updateUserById(teamLeader._id, { team: teamLeader.team.filter(item => item.id.toString() !== userId) });
            await userDao.updateUserById(userId, { role: "chief", company: ""});
            return res.status(200).json({ message: "Has dejado el equipo con éxito" });
        } catch (error) {
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    };    

    addUserToTeam = async (req, res) => {
        try {
            const { email } = req.body;
            const id = req.user.id;
            const loggedUser = await userDao.getUserById(id);
            if (!loggedUser) return res.status(404).json({ message: "Usuario logueado no encontrado" });
            const invitedUser = await userDao.getUserByProperty({ email: email.toLowerCase() });
            if (!invitedUser || invitedUser.length === 0) return res.status(404).json({ message: "El usuario con ese email no existe" });
            const invitedUserData = invitedUser[0];
            const usuarioEnEquipo = loggedUser.team.some(item => item.id.toString() === invitedUserData._id.toString());
            if(usuarioEnEquipo) return res.status(409).send({ message: "Este usuario ya pertenece a tu equipo.." });
            if(id === invitedUserData._id.toString()) return res.status(200).send({ message: "No te puedes invitar a ti mismo.." })
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
            const { id } = req.body;
            const userId = req.user.id;
            const user = await userDao.getUserById(userId);
            if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
            const invitation = user.invitations.find(item => item.teamId.toString() === id);
            if (!invitation) return res.status(404).json({ message: "Invitación no encontrada" });
            if(user.team.length < 1) {
                const teamLeader = await userDao.getUserById(id);
                const userCompany = {
                    companyId: teamLeader._id,
                    companyName: `${teamLeader.first_name} ${teamLeader.last_name}`,
                    companyEmail: teamLeader.email,
                    date: moment().format("DD/MM/YYYY")
                };
                if (!teamLeader) return res.status(404).json({ message: "El equipo no existe" });
                await userDao.updateUserById(teamLeader._id, { team: [ ...teamLeader.team, { id: user._id, image: user.image } ]});
                const updatedUser = await userDao.updateUserById(user._id, { invitations: user.invitations.filter(invite => invite.teamId.toString() !== id), role: "slave", company: userCompany });
                return res.status(200).json({ message: "Invitación aceptada con éxito", payload: updatedUser });
            } else {
                return res.status(404).send({ message: "Primero debes sacar a todos los miembros de tu equipo" });
            }
        } catch (error) {
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    };
    
    rejectInvitation = async(req, res) => {
        try {
            const { id } = req.body;
            const userId = req.user.id;
            const user = await userDao.getUserById(userId);
            if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
            const invitationExists = user.invitations.find(item => item.teamId.toString() === id);
            if (!invitationExists) return res.status(404).json({ message: "Invitación no encontrada.." });
            const updatedUser = await userDao.updateUserById(user._id.toString(), {
                invitations: user.invitations.filter(invite => invite.teamId.toString() !== id),
            });
            return res.status(200).json({ message: "Invitación rechazada con éxito", payload: updatedUser });
        } catch (error) {
            res.status(500).json({ message: "Error interno del servidor", error: error.message });
        }
    };    
};