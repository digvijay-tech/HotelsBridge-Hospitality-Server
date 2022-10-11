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
    feedback: {
        type: String,
        trim: true,
        minlength: 5,
        maxlength: 600,
        required: true
    },
    ratings: {
        type: Number,
        trim: true,
        min: 1,
        max: 5,
        required: true
    }
}, { timestamps: true });

const feedbackModel = mongoose.model("feedbacks", feedbackSchema);

module.exports = feedbackModel;
