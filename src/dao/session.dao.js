import SessionModel from "./models/session.model.js";
import { isValidId, connectDB } from "../config/mongoose.config.js";

export default class SessionDao {
    constructor() {
        connectDB(); // Conecta a la base de datos
    }

    getSessions = async () => {
        try {
            return await SessionModel.find();
        } catch ( error ) {
            throw new Error( "Error al obtener las sesiones: " + error.message );
        }
    };

    createSession = async ( userId, token ) => {
        try {
            if ( !isValidId( userId )) throw new Error( "ID no válido" );
            if ( !token ) throw new Error( "El token es requerido" );
            const session = new SessionModel({ userId, token });
            await session.save();
            return session;
        } catch ( error ) {
            throw new Error( "Error al crear una sesión: " + error.message );
        }
    };

    getSessionByUserId = async( userId ) => {
        try {
            if ( !isValidId( userId )) throw new Error( "ID no válido" );
            const session = await SessionModel.findOne({ userId });
            return session;
        } catch (error) {
            throw new Error( "Error al obtener la sesión por el userId: " + error.message );
        }
    }

    deleteSession = async ( token ) => {
        try {
            if ( !token ) throw new Error( "El token es requerido" );
            const session = await SessionModel.findOneAndDelete({ token });
            if ( !session ) throw new Error("Sesión no encontrada");
        } catch ( error ) {
            throw new Error( "Error al cerrar una sesión: " + error.message );
        }
    };

    getUserToken = async ( token ) => {
        try {
            if ( !token ) throw new Error( "El token es requerido" );
            const user = await SessionModel.findOne({ token });
            if ( !user ) throw new Error( "Usuario no encontrado" );
            return user;
        } catch ( error ) {
            throw new Error( "Error al obtener un token: " + error.message );
        }
    };
}
