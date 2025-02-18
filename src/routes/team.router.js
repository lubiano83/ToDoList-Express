import { Router } from "express";
import TeamController from "../controllers/team.controller.js";
import passport from "passport";
import { justSlave, justBoss, justChief, justDev } from "../middlewares/auth.middleware.js";

const ROUTER = Router();
const teamController = new TeamController();
const permissions = passport.authenticate("current", { session: false });

ROUTER.put("/role", permissions, justChief, teamController.updateRoleById);
ROUTER.put("/category", permissions, justChief, teamController.updateCategoryById);
ROUTER.post("/add", permissions, justBoss, teamController.addUserToTeam);
ROUTER.delete("/remove", permissions, justChief, teamController.removeUserFromTeam);
ROUTER.delete("/leave", permissions, justSlave, teamController.leaveTheTeam);
ROUTER.post("/invitation", permissions, justSlave, teamController.acceptInvitation);
ROUTER.delete("/reject", permissions, justChief, teamController.rejectInvitation);

export default ROUTER;