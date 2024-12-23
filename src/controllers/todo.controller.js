import TodoDao from "../dao/todo.dao.js";
import moment from "moment";

const todoDao = new TodoDao();

export default class TdoController {

    getTodos = async( req, res ) => {
        try {
            const todos = await todoDao.getTodos();
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

    getTodoByCategory = async( req, res ) => {
        try {
            const { category } = req.params;
            const todos = await todoDao.getTodoByProperty({ category });
            if( !todos ) return res.status( 404 ).send({ message: "Esa tarea no existe" });
            return res.status( 200 ).send({ message: "Las tareas por la categoria", payload: todos });
        } catch ( error ) {
            res.status( 500 ).send({ message: "Error al obtener datos desde el servidor", error: error.message });
        }
    };

    createTodo = async (req, res) => {
        try {
            const { title, category, dueDate } = req.body;
            if ( !title || !category || !dueDate ) return res.status(400).send({ message: "El título y la categoría son obligatorios." });
            const todo = await todoDao.getTodoByProperty({ title, category });
            if ( todo.length > 0 ) return res.status(409).send({ message: "Ese título y categoría ya existen." });
            const payload = await todoDao.createTodo({ title, category, dueDate: moment().format("DD/MM/YYYY") });
            return res.status( 201 ).send({ message: "Tarea cread exitosamente.", payload });
        } catch (error) {
            return res.status( 500 ).send({ message: "Error al procesar la solicitud.", error: error.message });
        }
    };
    
    updateTodoById = async( req, res ) => {
        try {
            const { id } = req.params;
            const { title, category, description, priority, completed, dueDate } = req.body;
            const todo = await todoDao.getTodoById( id );
            if( !todo ) return res.status( 404 ).send({ message: "Esa tarea no existe" });
            const payload = await todoDao.updateTodoById( id, { title, category, description, priority, completed, dueDate } );
            return res.status(200).send({ message: "Tarea modificada con exito", payload });
        } catch ( error ) {
            return res.status( 500 ).send({ message: "Error al procesar la solicitud.", error: error.message });
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