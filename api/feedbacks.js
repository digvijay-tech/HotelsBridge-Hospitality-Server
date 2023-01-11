// for managing guest feedbacks
const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const Feedback = require("../models/feedback");
const Room = require("../models/room");
const Filter = require("bad-words");
const axios = require("axios");
const filter = new Filter();


// custom middleware
const verifyAccess = require("../middlewares/verifyAccess");
const URCGuard = require("../middlewares/URCGuard");


// rate limit middleware for '/api/feedbacks/create' endpoint
const rateLimiterForPOST = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 mins
    max: 2, // Limit each IP to 2 requests per window
    standardHeaders: true, // returns rate limit info in the RateLimit-headers
    legacyHeaders: false, // disabled the "X-RateLimit-*" headers
    message: {
        code: 403,
        message: "Too many requests from this IP, please try again after 5 minutes"
    }
});


// type = POST
// Operation: to handle feedback submission from guest
// RateLimit: 2 attempts in 5mins.
router.post("/api/feedbacks/create", rateLimiterForPOST, URCGuard, (req, res) => {
    // check if the room is occupied
    Room.findOne({ roomNumber: req.body.roomNumber })
        .then((room) => {
            if (!room || room.isOccupied == false) {
                res.json({
                    code: 403,
                    message: "Your room portal is inactive, please contact reception."
                });
            } else if (room.roomNumber === req.body.roomNumber) {
                // saving feedback in the DB
                Feedback.create({
                    roomNumber: req.body.roomNumber,
                    fullName: filter.clean(req.body.fullName),
                    review: req.body.review,
                    housekeepingRating: req.body.housekeepingRating,
                    roomServiceRating: req.body.roomServiceRating,
                    frontOfficeRating: req.body.frontOfficeRating
                }).then((success) => {
                    // send notification details
                    axios.post(process.env.NS_URL, {
                        code: 200,
                        department: "reception",
                        notificationTitle: "Feedbacks",
                        notificationBody: `New feedback received from room: ${room.roomNumber}`,
                        timeStamp: success.createdAt
                    }, {
                        headers: {
                            "snstc": process.env.SNSTC
                        }
                    }).then((result) => {
                        if (!result) console.log(`Error: Failed to send feedback notification to NS..`);
                    }).catch((err) => {
                        if (err) console.log(`Error: Error while sending feedback to notification server..\n${err}`);
                    });

                    // ending response 
                    res.json({
                        code: 200,
                        message: "Thank you for submitting your feedback."
                    });
                }).catch((error) => {
                    if (error.code === 11000) {
                        res.json({
                            code: 403,
                            message: "You've already submitted your feedback."
                        })
                    } else {
                        console.log(`Error: Failed to save feedback in the DB...\n${error}`);
                        res.json({
                            code: 403,
                            message: "Unable to post your feedback, please try later."
                        });
                    }
                });
            } else {
                // for any other error
                res.send({
                    code: 403,
                    message: "Unable to process your request please contact reception"
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to find room for saving feedback...\n${error}`);
            res.json({
                code: 403,
                message: "Unable to post your feedback, please try later."
            });
        });
});


// type = GET
// Operation: for fetching feedbacks from the DB to show on staff-interface
// RateLimit: None
router.get("/api/feedbacks/fetchAll", verifyAccess, (req, res) => {
    Feedback.find()
        .then((feedbacks) => {
            if (!feedbacks) {
                console.log("Error: Unable to find feedbacks for '/api/feedbacks/fetchAll' api...");
                res.json({
                    code: 403,
                    message: "Unable to load feedbacks, please try again later."
                });
            }

            if (feedbacks) {
                res.json({
                    code: 200,
                    message: "Everything is up to date...",
                    feedbacks: feedbacks.reverse()
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to fetch feedbacks...\n${error}`);
            res.json({
                code: 403,
                message: "Unable to fetch feedbacks, please try logging-in again."
            });
        });
});


module.exports = router;
