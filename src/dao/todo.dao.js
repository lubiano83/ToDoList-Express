import TodoModel from "./models/todo.model.js";
import { connectDB, isValidId } from "../config/mongoose.config.js";

export default class TodoDao {

    constructor() {
        connectDB(); // Intentamos conectar a la base de datos
    }

    getTodos = async ( paramFilters = {} ) => {
        try {
            const $and = [];
            if (paramFilters.category) $and.push({ category: paramFilters.category });
            if (paramFilters.priority) $and.push({ priority: paramFilters.priority });
            if (paramFilters.completed) $and.push({ completed: paramFilters.completed });
            const filters = $and.length > 0 ? { $and } : {};
            let sort = {};
            if (paramFilters.sort && paramFilters.sort === "asc") {
                sort.dueDate = 1;
            } else if (paramFilters.sort && paramFilters.sort === "desc") {
                sort.dueDate = -1;
            }
            const limit = paramFilters.limit ? parseInt(paramFilters.limit) : 10;
            const page = paramFilters.page ? parseInt(paramFilters.page) : 1;
            const todosFound = await TodoModel.paginate( filters, { limit: limit, page: page, sort: sort, lean: true, pagination: true });
            let finalTodos = todosFound.docs;
            finalTodos = finalTodos.map(({ id, ...todosWithoutId }) => todosWithoutId);
            return { ...todosFound, docs: finalTodos };
        } catch (error) {
            throw new Error("Hubo un error al obtener los todos: " + error.message);
        }
    };

    getTodoById = async( id ) => {
        try {
            if (!isValidId(id)) throw new Error("ID no válido");
            return await TodoModel.findOne({ _id: id });
        } catch (error) {
            throw new Error( "Error al obtener el todo por el id: " + error.message );
        }
    }

    getTodoByProperty = async( doc ) => {
        try {
            return await TodoModel.find( doc );
        } catch (error) {
            throw new Error( "Error al obtener el todo por el id: " + error.message );
        }
    }

    createTodo = async( doc ) => {
        try {
            const todo = await TodoModel( doc );
            todo.save();
            return todo;
        } catch (error) {
            throw new Error( "Error al crear una tarea: " + error.message );
        }
    }

    updateTodoById = async( id, doc ) => {
        try {
            if (!isValidId(id)) throw new Error("ID no válido");
            const todo = await this.getTodoById( id );
            if(!todo) throw new Error("Producto no encontrado");
            return await TodoModel.findByIdAndUpdate(id, { $set: doc }, { new: true });
        } catch (error) {
            throw new Error(`Error al actualizar una tarea por el id: ${error.message}`);
        }
    }

    deleteTodoById = async( id ) => {
        try {
            if (!isValidId(id)) throw new Error("ID no válido");
            const todo = await this.getTodoById( id );
            if(!todo) throw new Error("Producto no encontrado");
            return await TodoModel.findByIdAndDelete( id );
        } catch (error) {
            throw new Error("Error al eliminar un producto por el id: " + error.message);
        }
    }
};