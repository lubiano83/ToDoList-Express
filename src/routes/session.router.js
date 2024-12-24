import { Router } from "express";
import UserController from "../controllers/user.controller.js";
import passport from "passport";
import { justSlave, justBoss, justChief, justDev } from "../middlewares/auth.middleware.js";

const ROUTER = Router();
const userController = new UserController();
const permissions = passport.authenticate("current", { session: false });

ROUTER.get("/", userController.getUserFromSession);
ROUTER.get("/registered", userController.usersRegistered);
ROUTER.get("/logged", userController.usersLogged);

export default ROUTER;