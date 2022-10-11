// DataBase model for non-admin users
const mongoose = require("mongoose");
const { isEmail } = require("validator");
const Schema = mongoose.Schema;

// user schema
const userSchema = new Schema({
    firstName: {
        type: String,
        maxlength: 16,
        minlength: 2,
        trim: true,
        lowercase: true,
        required: true
    },
    lastName: {
        type: String,
        maxlength: 16,
        minlength: 2,
        trim: true,
        lowercase: true,
        required: true
    },
    position: {
        type: String,
        maxlength: 34,
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
    department: {
        type: String,
        maxlength: 24,
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
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    },
    createdBy: {
        type: String,
        minlength: 6,
        maxlength: 32,
        trim: true,
        lowercase: true,
        required: true
    }
}, { timestamps: true });

// user model
const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
