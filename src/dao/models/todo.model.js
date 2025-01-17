import mongoose from "mongoose";
import moment from "moment";
import paginate from "mongoose-paginate-v2";

const collection = "todos";

const todoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true,
        maxlength: [100, 'El título no puede tener más de 100 caracteres']
    },
    category: {
        type: String,
        required: true,
        trim: true,
        maxlength: [50, 'La categoria es obligatoria']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede tener más de 500 caracteres'],
        default: ""
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    completed: {
        type: Boolean,
        default: false
    },
    dueDate: {
        type: String
    },
    createdAt: {
        type: String,
        default: moment().format("DD/MM/YYYY")
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true, // Asegúrate de que sea requerido si siempre debe estar presente
    },
});


todoSchema.pre("save", function (next) {
    if (this.dueDate) {
        this.dueDate = moment(this.dueDate, "DD/MM/YYYY").format("DD/MM/YYYY");
    }
    next();
});

todoSchema.plugin(paginate);

const TodoModel = mongoose.models[collection] || mongoose.model(collection, todoSchema);
export default TodoModel;
