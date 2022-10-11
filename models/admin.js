// DataBase model for admin user
const mongoose = require("mongoose");
const { isEmail } = require("validator");
const Schema = mongoose.Schema;

// admin schema
const adminSchema = new Schema({
    firstName: {
        type: String,
        maxlength: 14,
        minlength: 2,
        trim: true,
        lowercase: true,
        required: true
    },
    lastName: {
        type: String,
        maxlength: 14,
        minlength: 2,
        trim: true,
        lowercase: true,
        required: true
    },
    position: {
        type: String,
        maxlength: 24,
        minlength: 2,
        trim: true,
        lowercase: true,
        required: true
    },
    profile: {
        type: String,
        maxlength: 8,
        minlength: 4,
        trim: true,
        lowercase: true,
        required: true
    },
    phone: {
        type: String,
        maxlength: 14,
        minlength: 10,
        trim: true,
        required: true
    },
    email: {
        type: String,
        maxlength: 48,
        minlength: 6,
        trim: true,
        lowercase: true,
        validate: [isEmail, "Invalid Email Address"],
        unique: true,
        required: true
    },
    password: {
        type: String,
        trim: true,
        minlength: 20,
        required: true
    }
}, { timestamps: true });


// admin model
const adminModel = mongoose.model("admins", adminSchema);

module.exports = adminModel;
