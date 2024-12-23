import { Router } from "express";
import TodoController from "../controllers/todo.controller.js";

const todoController = new TodoController();
const ROUTER = Router();

ROUTER.get("/", todoController.getTodos);
ROUTER.post("/", todoController.createTodo);
ROUTER.get("/:id", todoController.getTodoById);
ROUTER.patch("/:id", todoController.updateTodoById);
ROUTER.delete("/:id", todoController.deleteTodoById);
ROUTER.get("/all/:category", todoController.getTodoByCategory);

export default ROUTER;
