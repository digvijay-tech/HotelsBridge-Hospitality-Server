// housekeeping request model
const mongoose = require("mongoose");
const Schema = mongoose.Schema;


// housekeeping request schema
const requestSchema = new Schema({
    roomNumber: {
        type: String,
        trim: true,
        minlength: 1,
        maxlength: 5,
        unique: false,
        required: true
    },
    message: {
        type: String,
        trim: true,
        minlength: 0,
        maxlength: 360,
        unique: false,
        required: false
    },
    items: [
        {
            itemId: {
                type: String,
                trim: true,
                minlength: 3,
                maxlength: 26,
                unique: false,
                required: true
            },
            name: {
                type: String,
                trim: true,
                minlength: 3,
                maxlength: 24,
                unique: false,
                required: true
            },
            quantity: {
                type: Number,
                trim: true,
                unique: false,
                required: false,
                default: 0
            }
        }
    ],
    status: {
        type: String,
        trim: true,
        minlength: 5,
        maxlength: 12,
        unique: false,
        default: "Pending",
        required: true
    },
    updatedBy: {
        user: {
            id: {
                type: String,
                trim: true,
                default: "GUEST",
                required: true
            },
            firstName: {
                type: String,
                trim: true,
                default: "No Changes Made",
                required: true
            },
            lastName: {
                type: String,
                trim: true,
                default: "No Changes Made",
                required: true
            },
            email: {
                type: String,
                trim: true,
                default: "No Changes Made",
                required: true
            },
            update: {
                type: String,
                trim: true,
                default: "Order Placed",
                required: true
            }
        }
    }
}, { timestamps: true });


// request model
const requestModel = mongoose.model("requests", requestSchema);


module.exports = requestModel;
