import { Router } from "express";
import TeamController from "../controllers/team.controller.js";
import passport from "passport";
import { justSlave, justBoss, justChief, justDev } from "../middlewares/auth.middleware.js";

const ROUTER = Router();
const teamController = new TeamController();
const permissions = passport.authenticate("current", { session: false });

ROUTER.put("/role", permissions, justChief, teamController.updateRoleById);
ROUTER.put("/category", teamController.updateCategoryById);
ROUTER.post("/add/:email", permissions, justChief, teamController.addUserToTeam);
ROUTER.delete("/remove/:email", permissions, justChief, teamController.removeUserFromTeam);
ROUTER.delete("/leave/:id", permissions, justSlave, teamController.leaveTheTeam);
ROUTER.post("/invitation/:id", permissions, justChief, teamController.acceptInvitation);
ROUTER.delete("/reject/:id", permissions, justChief, teamController.rejectInvitation);

export default ROUTER;