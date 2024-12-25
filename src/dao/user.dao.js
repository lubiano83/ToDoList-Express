import UserModel from "./models/user.model.js";
import { connectDB, isValidId } from "../config/mongoose.config.js";

export default class UserDao {

    constructor() {
        connectDB(); // Intentamos conectar a la base de datos
    }

    getUsers = async( paramFilters = {} ) => {
        try {
            const $and = [];
            if (paramFilters.category) $and.push({ category: paramFilters.category });
            if (paramFilters.role) $and.push({ role: paramFilters.role });
            if (paramFilters.email) $and.push({ email: paramFilters.email });
            const filters = $and.length > 0 ? { $and } : {};
            let sort = {};
            if (paramFilters.sort && paramFilters.sort === "asc") {
                sort.updatedAt = 1;
            } else if (paramFilters.sort && paramFilters.sort === "desc") {
                sort.updatedAt = -1;
            }
            const limit = paramFilters.limit ? parseInt(paramFilters.limit) : 10;
            const page = paramFilters.page ? parseInt(paramFilters.page) : 1;
            const usersFound = await UserModel.paginate( filters, { limit: limit, page: page, sort: sort, lean: true, pagination: true });
            let finalUsers = usersFound.docs;
            finalUsers = finalUsers.map(({ id, ...usersWithoutId }) => usersWithoutId);
            return { ...usersFound, docs: finalUsers };
        } catch (error) {
            throw new Error("Hubo un error al obtener los usuarios.." + error.message );
        }
    };

    getUserById = async( id ) => {
        try {
            if (!isValidId(id)) throw new Error("ID no válido");
            return await UserModel.findOne({ _id: id });
        } catch (error) {
            throw new Error( "Error al obtener el usuario por el id: " + error.message );
        }
    }

    getUserByProperty = async( doc ) => {
        try {
            return await UserModel.find( doc );
        } catch (error) {
            throw new Error( "Error al obtener el usuario por el email: " + error.message );
        }
    };

    createUser = async( userData ) => {
        try {
            const user = await UserModel( userData );
            await user.save();
            return user;
        } catch (error) {
            throw new Error( "Error al crear un usuario: " + error.message );
        }
    }

    updateUserById = async( id, doc ) => {
        try {
            if ( !isValidId( id )) throw new Error("ID no válido");
            const user = await this.getUserById( id );
            if ( !user ) throw new Error("Usuario no encontrado");
            return await UserModel.findByIdAndUpdate( id, { $set: doc }, { new: true });
        } catch ( error ) {
            throw new Error(`Error al actualizar un usuario por el id: ${error.message}`);
        }
    };

    deleteUserById = async( id ) => {
        try {
            if ( !isValidId( id )) throw new Error("ID no válido");
            const user = await this.getUserById( id );
            if ( !user ) return new Error("Usuario no encontrado");
            return await UserModel.findOneAndDelete({ _id: id });
        } catch ( error ) {
            throw new Error( "Error al eliminar un usuario y su carrito: " + error.message );
        }
    };
};