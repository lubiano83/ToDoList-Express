import { Router } from "express";
import UserController from "../controllers/user.controller.js";
import { uploadProfile, convertToWebp } from "../utils/uploader.js";
import passport from "passport";
import { justSlave, justBoss, justChief, justDev } from "../middlewares/auth.middleware.js";

const ROUTER = Router();
const userController = new UserController();
const permissions = passport.authenticate("current", { session: false });

ROUTER.get("/", userController.getUsers);
ROUTER.delete("/logout", userController.logoutUser);
ROUTER.post("/register", userController.registerUser);
ROUTER.post("/login", userController.loginUser);
ROUTER.get("/id", permissions, justSlave, userController.getUserById);
ROUTER.patch("/id", permissions, justSlave, uploadProfile.single("image"), convertToWebp, userController.updateUserById);
ROUTER.delete("/:id", userController.deleteUserById);

export default ROUTER;