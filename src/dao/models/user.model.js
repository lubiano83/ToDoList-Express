import mongoose from "mongoose";
import moment from "moment";
import paginate from "mongoose-paginate-v2";

const collection = "users";

const userSchema = new mongoose.Schema({
    image: {
        type: String,
        default: "../../public/profile-round-1342-svgrepo-com.svg"
    },
    first_name: {
        type: String,
        trim: true,
        required: [true, 'El nombre es obligatorio'],
    },
    last_name: {
        type: String,
        trim: true,
        required: [true, 'El apellido es obligatorio'],
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        trim: true,
        required: true,
    },
    category: {
        type: String,
        trim: true,
        default: ""
    },
    role: {
        type: String,
        enum: [ "slave", "boss", "chief" ],
        default: "chief"
    },
    company: {
        type: Object,
        default: ""
    },
    team: {
        type: Array,
        default: []
    },
    invitations: {
        type: Array,
        default: []
    },
    todos: {
        type: Array,
        default: []
    },
    createdAt: {
        type: String,
        default: moment().format("DD/MM/YYYY")
    },
    updatedAt: {
        type: String,
        default: moment().format("DD/MM/YYYY")
    },
    score: {
        type: Number,
        default: 0
    }
});

// Hook pre-save para formatear `updatedAt` antes de guardar
userSchema.pre("save", function (next) {
    this.updatedAt = moment().format("DD/MM/YYYY");
    next();
});

// Hook pre-update para formatear `updatedAt` antes de una actualización
userSchema.pre("findOneAndUpdate", function (next) {
    this._update.updatedAt = moment().format("DD/MM/YYYY");
    next();
});

userSchema.plugin(paginate);

const UserModel = mongoose.models[collection] || mongoose.model(collection, userSchema);
export default UserModel;