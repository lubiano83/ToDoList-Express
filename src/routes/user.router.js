import { Router } from "express";
import UserController from "../controllers/user.controller.js";
import { uploadProfile } from "../utils/uploader.js";
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
ROUTER.patch("/id", permissions, justChief, uploadProfile.single("image"), userController.updateUserById);
ROUTER.delete("/:id", userController.deleteUserById);
ROUTER.put("/role/:id", permissions, justChief, userController.updateRoleById);
ROUTER.put("/category/:id", userController.updateCategoryById);
ROUTER.post("/add/:email", permissions, justChief, userController.addUserToTeam);
ROUTER.delete("/remove/:email", permissions, justChief, userController.removeUserFromTeam);
ROUTER.delete("/leave/:id", permissions, justSlave, userController.leaveTheTeam);
ROUTER.post("/invitation/:id", permissions, justChief, userController.acceptInvitation);
ROUTER.delete("/reject/:id", permissions, justChief, userController.rejectInvitation);

export default ROUTER;