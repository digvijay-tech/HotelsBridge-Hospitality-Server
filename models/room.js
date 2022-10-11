// DataBase model for Room
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Room Schema
const roomSchema = new Schema({
    roomNumber: {
        type: String,
        trim: true,
        minlength: 2,
        maxlength: 8,
        unique: true,
        required: true
    },
    roomType: {
        type: String,
        trim: true,
        uppercase: true,
        minlength: 2,
        maxlength: 16,
        required: true
    },
    isOccupied: {
        type: Boolean,
        default: false,
        required: true
    },
    urc: {
        type: String, // urc stands for Unique Room Code
        minlength: 8,
        maxlength: 164,
        unique: true,
        required: true
    }
}, { timestamps: true });

// Room Model
const roomModel = mongoose.model("rooms", roomSchema);

module.exports = roomModel;
