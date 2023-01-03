// only for handling roomservice orders
const router = require("express").Router();
const Orders = require("../models/order");
const Rooms = require("../models/room");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const UserActivity = require("../models/activityLog");

// custom middlewares
const verifyAccess = require("../middlewares/verifyAccess");
const URCGuard = require("../middlewares/URCGuard");


// rate limit middleware for '/api/order/place' endpoint
const rateLimitForOrderPOST = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 10, // Limit each IP to 10 requests per window
    standardHeaders: true, // returns rate limit info in the RateLimit-headers
    legacyHeaders: false, // disabled the "X-RateLimit-*" headers
    message: {
        code: 403,
        message: "Too many login requests from this IP, please try again after 10 minutes"
    }
});

// type = POST
// Operation: to receive orders fromt the guest-interface
// RateLimit: No Limit
router.post("/api/order/place", rateLimitForOrderPOST, URCGuard, (req, res) => {
    // check if the room is occupied
    Rooms.findOne({ roomNumber: req.body.roomNumber })
        .then((room) => {
            // check if the room doesn't exists
            if (!room) {
                console.log(`Error: Failed to find room for taking roomservice order..`);
                res.json({
                    code: 403,
                    message: "Unable to process your order, please contact reception."
                });
            }

            // check if the room is occupied and exists
            if (room && room.isOccupied) {
                // storing order
                Orders.create({
                    roomNumber: req.body.roomNumber,
                    items: req.body.items,
                    paymentMethod: req.body.paymentMethod,
                    message: req.body.message
                }).then((result) => {
                    if (!result) {
                        res.json({
                            code: 403,
                            message: "Something went wrong try again or contact reception."
                        });
                    }

                    if (result) {
                        // send notification details
                        axios.post(process.env.NS_URL, {
                            code: 200,
                            department: "roomservice",
                            notificationTitle: "Room Service",
                            notificationBody: `New order received from room: ${room.roomNumber}`,
                            timeStamp: result.createdAt
                        }, {
                            headers: {
                                "snstc": process.env.SNSTC
                            }
                        }).then((response) => {
                            if (!response) console.log(`Error: Failed to send order notification to NS..`);
                        }).catch((err) => {
                            if (err) console.log(`Error: Error while sending order to notification server..\n${err}`);
                        });

                        // end response
                        res.json({
                            code: 200,
                            message: "Order placed successfully. Someone from room service will get in touch soon."
                        });
                    }
                }).catch((error) => {
                    console.log(`Error: Failed to save order into the DB...\n${error}`);
                    res.send({
                        code: 403,
                        error: "Unable to process your order please contact reception."
                    });
                });
            } else {
                res.json({
                    code: 403,
                    message: "Your room portal is not active please contact reception"
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to find room for verifying its status, for placing order...\n${error}`);
            res.json({
                code: 403,
                message: "Unable to process your request, please contact reception."
            });
        });
});


// type = GET
// Operation: to provide received orders to the staff-interface
// RateLimit: No Limit
router.get("/api/order/fetchAll", verifyAccess, (req, res) => {
    Orders.find()
        .then((result) => {
            if (!result) {
                res.json({
                    code: 403,
                    message: "Unable to fetch orders.."
                });
            }

            if (result) {
                res.json({
                    code: 200,
                    message: "Everything is up to date..",
                    orders: result
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to fetch the orders..${error}`);
            res.json({
                code: 403,
                message: "Unable to process your request please login again."
            });
        });
});


// type = PUT
// Operation: allowing users to update order status
// RateLimit: Not Specified
router.put("/api/order/updateStatus", verifyAccess, (req, res) => {
    Orders.findByIdAndUpdate({ _id: req.body.orderId }, { $set: {
        status: req.body.newStatus,
        updatedBy: {
            user: {
                id: req.body.decodedUser._id,
                firstName: req.body.decodedUser.firstName,
                lastName: req.body.decodedUser.lastName,
                email: req.body.decodedUser.email,
                update: req.body.newStatus
            }
        }
    } })
        .then((order) => {
            if (!order) {
                res.json({
                    code: 403,
                    message: "Unable to update the order status, try again later."
                });
            }

            if (order) {
                // recording user activity log
                const userName = `${req.body.decodedUser.firstName} ${req.body.decodedUser.lastName}`;
                const activity = `Order status for room ${order.roomNumber} was changed to ${req.body.newStatus} by ${userName}`;

                UserActivity.create({
                    userName: userName,
                    activity: activity
                }).then((success) => {
                    // processing update
                    if (!success) {
                        res.json({
                            code: 403,
                            message: "Failed to log user activity, please click refresh to check the order status."
                        });
                    }

                    if (success) {
                        res.json({
                            code: 200,
                            message: "order status updated successfully"
                        });
                    }
                }).catch((error) => {
                    console.log(`Error: Failed to log user activity in the DB for order status update..\n${error}`);
                    res.json({
                        code: 403,
                        message: "Failed to log user activity, please click refresh to check order status."
                    });
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to find the order for update..\n${error}`);
            res.json({
                code: 403,
                message: "Unable to update the order status, please try later."
            });
        });
});

module.exports = router;
