// REST API for rooms only
const router = require("express").Router();
const uuid = require("uuid");
const rateLimit = require("express-rate-limit");
const Room = require("../models/room");
const verifyAccess = require("../middlewares/verifyAccess");

// for storing user activity logs
const UserActivity = require("../models/activityLog");



// rate limit middleware for '/api/rooms/update/urc' && '/api/rooms/updateStatus' endpoint
const rateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 30, // Limit each IP to 30 requests per window
    standardHeaders: true, // returns rate limit info in the RateLimit-headers
    legacyHeaders: false, // disabled the "X-RateLimit-*" headers
    message: {
        code: 403,
        message: "Too many requests from this IP, please try again after 10 minutes"
    }
});


// type = GET
// Operation: for fetching all the rooms from the database
// RateLimit: NOT SPECIFIED
router.get("/api/rooms/fetchAll", verifyAccess, (req, res) => {
    Room.find()
        .then((result) => {
            if (!result) {
                console.log(`Error: Unable to find rooms object...\n`);
                res.json({
                    code: 403,
                    message: "Failed to fetch rooms, please try again later."
                });
            } else {
                // improving sort order
                let sortedRooms = result.sort((a, b) => {
                    return Number(a.roomNumber) - Number(b.roomNumber);
                });

                res.json({
                    code: 200,
                    message: "Everything is up to date..",
                    rooms: sortedRooms
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to fetch rooms from database...\n${error}`);
            res.json({
                code: 403,
                message: "Failed to fetch rooms, please click on fetch button after few seconds."
            });
        });
});


// type = PUT
// Operation: for updating room status
// RateLimit: 30 attempts in 10mins
// UserActivityLogs: YES
router.put("/api/rooms/updateStatus", rateLimiter, verifyAccess, (req, res) => {
    Room.findByIdAndUpdate({ _id: req.body._id }, { isOccupied: req.body.isOccupied })
        .then((room) => {
            if (!room) {
                // check if room exists
                console.log(`Error: Unable to find the room..\n${room}`);
                res.json({
                    code: 403,
                    message: "message: Unable to update the room status"
                })
            } else {
                // preparing payload
                let userName = `${req.body.decodedUser.firstName} ${req.body.decodedUser.lastName}`;
                let activity = req.body.isOccupied ? `status of room ${req.body.roomNumber} was updated to occupied.` : `status of room ${req.body.roomNumber} was updated to vacant.`;
                
                // process user activity logs
                UserActivity.create({
                    userName: userName,
                    activity: activity
                }).then((success) => {
                    // processing update
                    if (!success) {
                        res.json({
                            code: 403,
                            message: "Failed to log user activity, please click refresh to check the room status."
                        });
                    }

                    if (success) {
                        res.json({
                            code: 200,
                            message: "Room status updated successfully"
                        });
                    }
                }).catch((error) => {
                    console.log(`Error: Failed to log user activity in the DB for room status update..\n${error}`);
                    res.json({
                        code: 403,
                        message: "Failed to log user activity, please click refresh to check room status."
                    });
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to find the room for update..\n${error}`);
            res.json({
                code: 403,
                message: "Unable to update the room status"
            });
        });
});



// type = PUT
// Operation: for ending updating old urc to new one.
// RateLimit: 30 attempts in 10mins
// UserActivityLogs: YES
router.put("/api/rooms/update/urc", rateLimiter, verifyAccess, (req, res) => {
    Room.findByIdAndUpdate({ _id: req.body._id }, { urc: uuid.v4() })
        .then((result) => {
            if (!result) {
                // check if room exists
                console.log(`Error: Unable to find the room with _id: ${req.body._id}\n`);
                res.json({
                    code: 403,
                    message: "Unable to update room session, please try later."
                });
            }

            if (result) {
                // preparing payload
                let userName = `${req.body.decodedUser.firstName} ${req.body.decodedUser.lastName}`;
                let activity = `New QR code session was started for room: ${result.roomNumber}`;

                // process user activity logs
                UserActivity.create({
                    userName: userName,
                    activity: activity
                }).then((success) => {
                    // processing update
                    if (!success) {
                        res.json({
                            code: 403,
                            message: "Failed to log user activity, please check the QR code manually."
                        });
                    }

                    if (success) {
                        res.json({
                            code: 200,
                            message: "New QR code session started.."
                        });
                    }
                }).catch((error) => {
                    console.log(`Error: Failed to log user activity in the DB for urc update..\n${error}`);
                    res.json({
                        code: 403,
                        message: "Failed to log user activity, please check the QR code manually."
                    });
                });
            }
        })
        .catch((error) => {
            console.log(`Failed to find and update room urc..\n${error}`);
            res.json({
                code: 403,
                message: "Unable to process your request please try later."
            });
        });
});

module.exports = router;
