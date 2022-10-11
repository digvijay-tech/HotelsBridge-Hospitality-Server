// DataBase model for user activity
const mongoose = require("mongoose");
const Schema = mongoose.Schema

// creating user activity schema
const userActivitySchema = new Schema({
    userName: {
        type: String,
        maxlength: 36,
        minlength: 4,
        trim: true,
        lowercase: true,
        required: true
    },
    activity: {
        type: String,
        maxlength: 220,
        minlength: 6,
        trim: true,
        lowercase: true,
        require: true
    }
}, { timestamps: true });


// model for user activity schema
const userActivityModel = mongoose.model("userActivity", userActivitySchema);


module.exports = userActivityModel;
