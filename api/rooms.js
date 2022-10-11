// REST API for rooms only
const router = require("express").Router();
const Room = require("../models/room");
const verifyAccess = require("../middlewares/verifyAccess");

// for storing user activity logs
const UserActivity = require("../models/activityLog");


// type = GET
// Operation: for fetching all the rooms from the database
// RateLimit: 300 attempts in 5 mins
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
// RateLimit: 300 attempts in 5mins
// UserActivityLogs: YES
router.put("/api/rooms/updateStatus", verifyAccess, (req, res) => {
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

module.exports = router;
