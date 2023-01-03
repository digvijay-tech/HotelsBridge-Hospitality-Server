// a database model for room service orders
const mongoose = require("mongoose");
const Schema = mongoose.Schema;


// order schema
const orderSchema = new Schema({
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
            price: {
                type: String,
                trim: true,
                minlength: 1,
                maxlength: 6,
                unique: false,
                required: true
            },
            quantity: {
                type: Number,
                trim: true,
                min: [1, "quantity cannot be less than 1"],
                max: [10, "quantity cannot be more than 10"],
                unique: false,
                required: true
            }
        }
    ],
    paymentMethod: {
        type: String,
        trim: true,
        minlength: 4,
        maxlength: 24,
        unique: false,
        default: "To Room",
        required: true
    },
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


// order model
const orderModel = mongoose.model("orders", orderSchema);

module.exports = orderModel;
