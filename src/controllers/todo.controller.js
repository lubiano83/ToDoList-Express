import TodoDao from "../dao/todo.dao.js";
import moment from "moment";

const todoDao = new TodoDao();

export default class TdoController {

    getTodos = async( req, res ) => {
        try {
            const paramFilters = req.query;
            const todos = await todoDao.getTodos( paramFilters );
            return res.status( 200 ).send({ message: "Todos las tareas", payload: todos });
        } catch ( error ) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    getTodoById = async( req, res ) => {
        try {
            const { id } = req.params;
            const todo = await todoDao.getTodoById( id );
            if( !todo ) return res.status(404).send({ message: "Esa tarea no existe" });
            return res.status(200).send({ message: "Una tarea por el id", payload: todo });
        } catch ( error ) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    createTodo = async (req, res) => {
        try {
            const { title, category, dueDate } = req.body;
            if ( !title || !category || !dueDate ) return res.status(400).send({ message: "Todos los campos son obligatorios" });
            const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
            if (!dateRegex.test(dueDate)) return res.status(400).send({ message: "El formato de la fecha debe ser DD/MM/YYYY" });
            const todo = await todoDao.getTodoByProperty({ title, category });
            if ( todo.length > 0 ) return res.status(409).send({ message: "Ese título y categoría ya existen." });
            const formattedDueDate = moment(dueDate, "DD/MM/YYYY").format("DD/MM/YYYY");
            const payload = await todoDao.createTodo({ title: title.toLowerCase(), category: category.toLowerCase(), dueDate: formattedDueDate });
            return res.status( 201 ).send({ message: "Tarea creada exitosamente.", payload });
        } catch (error) {
            return res.status( 500 ).send({ message: "Error al procesar la solicitud.", error: error.message });
        }
    };
    
    updateTodoById = async (req, res) => {
        try {
            const { id } = req.params;
            const { title, category, description, priority, completed, dueDate } = req.body;
            const todo = await todoDao.getTodoById(id);
            if (!todo) return res.status(404).send({ message: "Esa tarea no existe" });
            const updatedFields = {};
            if (title) updatedFields.title = title.toLowerCase();
            if (category) updatedFields.category = category.toLowerCase();
            if (description) updatedFields.description = description.toLowerCase();
            if (priority) updatedFields.priority = priority.toLowerCase();
            if (completed !== undefined) updatedFields.completed = completed;
            if (dueDate) updatedFields.dueDate = moment(dueDate, "DD/MM/YYYY").format("DD/MM/YYYY");
            if (dueDate) {
                if (!moment(dueDate, "DD/MM/YYYY", true).isValid()) return res.status(400).send({ message: "El formato de la fecha debe ser DD/MM/YYYY" });
                updatedFields.dueDate = moment(dueDate, "DD/MM/YYYY").format("DD/MM/YYYY");
            }
            const payload = await todoDao.updateTodoById(id, updatedFields);
            return res.status(200).send({ message: "Tarea modificada con éxito", payload });
        } catch (error) {
            return res.status(500).send({ message: "Error al procesar la solicitud.", error: error.message });
        }
    };    

    deleteTodoById = async( req, res ) => {
        try {
            const { id } = req.params;
            const todo = await todoDao.getTodoById( id );
            if( !todo ) return res.status(404).send({ message: "Esa tarea no existe" });
            const payload = await todoDao.deleteTodoById( id );
            return res.status(200).send({ message: "Tarea eliminada con exito", payload })
        } catch (error) {
            return res.status( 500 ).send({ message: "Error al procesar la solicitud.", error: error.message });
        }
    };
};