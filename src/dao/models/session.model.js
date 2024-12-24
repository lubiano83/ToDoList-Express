import mongoose from "mongoose";
import moment from "moment";

const collection = 'sessions';

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    createdAt: {
        type: Date,
        default: () => moment().format("hh/mm/ss"),
        expires: 3600
    }
});

const SessionModel = mongoose.models[collection] || mongoose.model(collection, sessionSchema);
export default SessionModel;