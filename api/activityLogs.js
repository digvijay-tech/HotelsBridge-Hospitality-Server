// only for handling  User Activity Logs requests
const router = require("express").Router();
const UserActivity = require("../models/activityLog");
const rateLimit = require("express-rate-limit");

// custom middlewares
const processAdminPrivilege = require("../middlewares/processAdminPrivilege");


// rate limit middleware for '/api/userActivitylogs' endpoint
const rateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 mins
    max: 20, // Limit each IP to 20 requests per window
    standardHeaders: true, // returns rate limit info in the RateLimit-headers
    legacyHeaders: false, // disabled the "X-RateLimit-*" headers
    message: {
        code: 403,
        message: "Too many login requests from this IP, please try again after 5 minutes"
    }
});

// type = GET
// Operation: For retriving user activity logs from the DB
// RateLimit: 20 attempts in 5mins.
router.get("/api/userActivitylogs", rateLimiter, processAdminPrivilege, (req, res) => {
    UserActivity.find()
        .then((logs) => {
            if (!logs) {
                res.json({
                    code: 403,
                    message: "Unable to find user activity logs, please try again later."
                });
            }

            if (logs) {
                res.json({
                    code: 200,
                    message: "Everything is up to date..",
                    logs: logs.reverse()
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to find logs..${error}`);
            res.json({
                code: 403,
                message: "Failed to fetch logs, please try later."
            });
        });
});


module.exports = router;
