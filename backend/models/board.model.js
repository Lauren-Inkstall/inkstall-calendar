import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
}, { timestamps: true });

const Board = mongoose.model('Board', boardSchema);
export default Board;