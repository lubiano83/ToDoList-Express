import { Router } from "express";
import TodoController from "../controllers/todo.controller.js";
import passport from "passport";
import { justSlave, justBoss, justChief, justDev } from "../middlewares/auth.middleware.js";

const ROUTER = Router();
const todoController = new TodoController();
const permissions = passport.authenticate("current", { session: false });

ROUTER.get("/", permissions, justSlave, todoController.getTodos);
ROUTER.post("/", permissions, justBoss, todoController.createTodo);
ROUTER.get("/:id", todoController.getTodoById);
ROUTER.patch("/:id", permissions, justBoss, todoController.updateTodoById);
ROUTER.delete("/:id", permissions, justChief, todoController.deleteTodoById);

export default ROUTER;
