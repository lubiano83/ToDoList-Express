import { Router } from "express";
import UserController from "../controllers/user.controller.js";
import { uploadProfile } from "../utils/uploader.js";

const userController = new UserController();
const ROUTER = Router();

ROUTER.get("/", userController.getUsers);
ROUTER.delete("/logout", userController.logoutUser);
ROUTER.post("/register", userController.registerUser);
ROUTER.post("/login", userController.loginUser);
ROUTER.get("/:id", userController.getUserById);
ROUTER.patch("/:id", uploadProfile.single("image"), userController.updateUserById);
ROUTER.put("/:id", userController.updateRoleById);
ROUTER.get("/email/:email", userController.getUserByEmail);

export default ROUTER;