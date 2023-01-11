// Database model for feedbacks
const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const feedbackSchema = new Schema({
    roomNumber: {
        type: String,
        trim: true,
        minlength: 2,
        maxlength: 6,
        unique: false,
        required: true
    },
    fullName: {
        type: String,
        trim: true,
        lowercase: true,
        minlength: 4,
        maxlength: 28,
        unique: false,
        required: true
    },
    review: {
        type: String,
        trim: true,
        minlength: 0,
        maxlength: 600,
        unique: false,
        required: false,
        default: ""
    },
    housekeepingRating: {
        type: Number,
        trim: true,
        min: 0,
        max: 10,
        required: false,
        unique: false,
        default: 0
    },
    roomServiceRating: {
        type: Number,
        trim: true,
        min: 0,
        max: 10,
        required: false,
        unique: false,
        default: 0
    },
    frontOfficeRating: {
        type: Number,
        trim: true,
        min: 0,
        max: 10,
        required: false,
        unique: false,
        default: 0
    }
}, { timestamps: true });

const feedbackModel = mongoose.model("feedbacks", feedbackSchema);

module.exports = feedbackModel;
