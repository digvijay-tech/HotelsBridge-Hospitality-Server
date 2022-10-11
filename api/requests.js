// only for handling housekeeping requests
const router = require("express").Router();
const Requests = require("../models/request");
const Rooms = require("../models/room");
const Filter = require("bad-words");
const rateLimit = require("express-rate-limit");
const UserActivity = require("../models/activityLog");
const filter = new Filter();


// custom middlewares
const verifyAccess = require("../middlewares/verifyAccess");
const URCGuard = require("../middlewares/URCGuard");


// rate limit middleware for '/api/request/place' endpoint
const rateLimitForRequestPOST = rateLimit({
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
// Operation: to receive housekeeping requests fromt the guest-interface
// RateLimit: 10
router.post("/api/request/place", rateLimitForRequestPOST, URCGuard, (req, res) => {
    // check if the room is occupied
    Rooms.findOne({ roomNumber: req.body.roomNumber })
        .then((room) => {
            // check if the room doesn't exists
            if (!room) {
                console.log(`Error: Failed to find room for taking housekeeping request..`);
                res.json({
                    code: 403,
                    message: "Unable to process your order, please contact reception."
                });
            }

            // check if the room is occupied and exists
            if (room && room.isOccupied) {
                // save request in the DB
                Requests.create({
                    roomNumber: req.body.roomNumber,
                    message: req.body.message,
                    items: req.body.items
                }).then((result) => {
                    if (!result) {
                        res.json({
                            code: 403,
                            message: "Something went wrong try again or contact reception."
                        });
                    }

                    if (result) {
                        res.json({
                            code: 200,
                            message: "Request sent successfully. Someone from housekeeping will get in touch soon."
                        });
                    }
                }).catch((error) => {
                    console.log(`Error: Failed to save request into the DB...\n${error}`);
                    res.send({
                        code: 403,
                        error: "Unable to process your request please contact reception."
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
            console.log(`Error: Failed to find room for verifying its status, for placing request...\n${error}`);
            res.json({
                code: 403,
                message: "Unable to process your request, please contact reception."
            });
        });
});



// type = GET
// Operation: for sending housekeeping requests to staff-interface
// RateLimit: No Limit
router.get("/api/request/fetchAll", verifyAccess, (req, res) => {
    Requests.find()
        .then((result) => {
            if (!result) {
                res.json({
                    code: 403,
                    message: "Unable to fetch housekeeping requests.."
                });
            }

            if (result) {
                res.json({
                    code: 200,
                    message: "Everything is up to date..",
                    requests: result
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to fetch the requests..${error}`);
            res.json({
                code: 403,
                message: "Unable to process your request please login again."
            });
        });
});



// type = PUT
// Operation: for updating request status
// RateLimit: Not Specified
router.put("/api/request/updateStatus", verifyAccess, (req, res) => {
    Requests.findByIdAndUpdate({ _id: req.body.requestId }, { $set: {
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
        .then((request) => {
            if (!request) {
                res.json({
                    code: 403,
                    message: "Unable to update the request status, try again later."
                });
            }

            if (request) {
                // recording user activity log
                let userName = `${req.body.decodedUser.firstName} ${req.body.decodedUser.lastName}`;
                let activity = `Housekeeping request status for room ${request.roomNumber} was changed to ${req.body.newStatus} by ${userName}`;

                UserActivity.create({
                    userName: userName,
                    activity: activity
                }).then((success) => {
                    // processing update
                    if (!success) {
                        res.json({
                            code: 403,
                            message: "Failed to log user activity, please click refresh to check the request status."
                        });
                    }

                    if (success) {
                        res.json({
                            code: 200,
                            message: "request status updated successfully"
                        });
                    }
                }).catch((error) => {
                    console.log(`Error: Failed to log user activity in the DB for request status update..\n${error}`);
                    res.json({
                        code: 403,
                        message: "Failed to log user activity, please click refresh to check request status."
                    });
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to find the request for update..\n${error}`);
            res.json({
                code: 403,
                message: "Unable to update the request status, please try later."
            });
        });
});


module.exports = router;
