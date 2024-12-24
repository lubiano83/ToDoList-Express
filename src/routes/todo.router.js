import { Router } from "express";
import TodoController from "../controllers/todo.controller.js";
import passport from "passport";
import { justSlave, justBoss, justChief, justDev } from "../middlewares/auth.middleware.js";

const ROUTER = Router();
const todoController = new TodoController();
const permissions = passport.authenticate("current", { session: false });

ROUTER.get("/", todoController.getTodos);
ROUTER.post("/", todoController.createTodo);
ROUTER.get("/:id", todoController.getTodoById);
ROUTER.patch("/:id", todoController.updateTodoById);
ROUTER.delete("/:id", todoController.deleteTodoById);
ROUTER.get("/all/:category", todoController.getTodoByCategory);

export default ROUTER;
