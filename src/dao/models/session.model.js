import mongoose from "mongoose";
import moment from "moment";

const collection = "sessions";

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true, // Asegúrate de que sea requerido si siempre debe estar presente
    },
    token: {
        type: String,
        unique: true,
        required: true,
    },
    createdAt: {
        type: String,
        default: moment().format("HH:mm:ss"),
        expires: 3600
    },
});

sessionSchema.pre(/^find/, function (next) {
    this.populate({
        path: "userId", // Popula `detail` dentro de `products`
        model: "users",
    });
    next();
});

const SessionModel = mongoose.models[collection] || mongoose.model(collection, sessionSchema);
export default SessionModel;