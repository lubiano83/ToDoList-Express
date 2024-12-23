import { response } from "../utils/response.js";

//Hacemos una funcion que verifique que seas user:
export function soloDev(req, res, next) {
    if (!req.user) return response(res, 401, "No autenticado.");
    if(req.user.role === "developer") return next();
    return response(res, 403, "Acceso denegado, solo delevoler..");
}

//Hacemos una funcion que verifique que seas admin:
export function soloAdmin(req, res, next) {
    if (!req.user) return response(res, 401, "No autenticado.");
    if(req.user.role === "admin" || req.user.role === "developer") return next();
    return response(res, 403, "Acceso denegado, solo admin..");
}

//Hacemos una funcion que verifique que seas user:
export function soloUser(req, res, next) {
    if (!req.user) return response(res, 401, "No autenticado.");
    if(req.user.role === "user" || req.user.role === "developer") return next();
    return response(res, 403, "Acceso denegado, solo usuarios..");
}
