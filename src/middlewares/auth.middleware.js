//Hacemos una funcion que verifique que seas developer:
export function justDev(req, res, next) {
    if (!req.user) return res.status(401).send({ message: "No autenticado." });
    if(req.user.role === "developer") return next();
    return response(res, 403, "Acceso denegado, solo delevoler..");
}

//Hacemos una funcion que verifique que seas chief:
export function justChief(req, res, next) {
    if (!req.user) return res.status(401).send({ message: "No autenticado." });
    if(req.user.role === "chief" || req.user.role === "developer") return next();
    return response(res, 403, "Acceso denegado, solo delevoler..");
}

//Hacemos una funcion que verifique que seas boss:
export function justBoss(req, res, next) {
    if (!req.user) return res.status(401).send({ message: "No autenticado." });
    if(req.user.role === "boss" || req.user.role === "chief" || req.user.role === "developer") return next();
    return response(res, 403, "Acceso denegado, solo admin..");
}

//Hacemos una funcion que verifique que seas slave:
export function justSlave(req, res, next) {
    if (!req.user) return res.status(401).send({ message: "No autenticado." });
    if(req.user.role === "slave" || req.user.role === "boss" || req.user.role === "chief" || req.user.role === "developer") return next();
    return response(res, 403, "Acceso denegado, solo usuarios..");
}
