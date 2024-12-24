import SessionModel from "./session.dao.js"
import { isValidId, connectDB } from "../config/mongoose.config.js";

export default class SessionDao {

    constructor() {
        connectDB(); // Intentamos conectar a la base de datos
    }

    getSessions = async () => {
        try {
            return await SessionModel.find();
        } catch (error) {
            throw new Error( "Error al obtener las sessions " + error.message );
        }
    };
    
    createSession = async ( id, token ) => {
        try {
            if (!isValidId(id)) throw new Error("ID no válido");
            const session = await SessionModel( id, token );
            await session.save();
            return session;
        } catch (error) {
            throw new Error( "Error al crear una session " + error.message );
        }
    };

    deleteSession = async ( token ) => {
        try {
            const session = await SessionModel.findOneAndDelete({ token });
            if (!session) throw new Error ("Session no encontrada");
        } catch (error) {
            throw new Error( "Error al cerrar una session " + error.message );
        }
    };

    getUserToken = async( token ) => {
        try {
            const user = await SessionModel.findOne({ token });
            if(!user) throw new Error ("Usuario no encontrado");
            const userToken = user.token
            return userToken;
        } catch (error) {
            throw new Error( "Error al obtener un token " + error.message );
        }
    };
}