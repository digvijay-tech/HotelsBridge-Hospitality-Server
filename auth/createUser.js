// this endpoint allows admin-users to create non-admin users
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const User = require("../models/user");

// custom middleware
const processAdminPrivilege = require("../middlewares/processAdminPrivilege");

// utility module
const { INFORMER_EMAIL } = require("../utility/mailer");


// rate limit for this endpoint
const requestLimitter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 mins
    max: 10, // Limit each IP to 10 requests per window
    standardHeaders: true, // returns rate limit info in the RateLimit-headers
    legacyHeaders: false, // disabled the "X-RateLimit-*" headers
    message: {
        code: 403,
        message: "Too many login requests from this IP, please try again after 30 minutes"
    }
});


// type = POST
// Operation: Creating non-admin users with Admin privileges
// RateLimited: 10 attempts in 30mins.
router.post("/auth/admin/createUser", requestLimitter, processAdminPrivilege, (req, res) => {
    User.findOne({ email: req.body.email })
        .then((user) => {
            // if user doesn't exist create user
            if (!user) {
                User.create({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    profile: req.body.profile,
                    position: req.body.position,
                    department: req.body.department,
                    phone: req.body.phone,
                    email: req.body.email,
                    password: bcrypt.hashSync(req.body.password, 10),
                    createdBy: req.body.creatorFirstName + " " + req.body.creatorLastName
                }).then((success) => {
                    // sending email to inform user about account setup
                    INFORMER_EMAIL(success.email, "Your HOTELSBRIDGE Account Is Now Activated", `Dear ${success.firstName},\nCongratulations on joining HotelsBridge. Your account is all setup and ready for your to use. kindly, contact your manager for your account credentials.\n\nDO NOT REPLY TO THIS EMAIL.\n\nkind regards,\nTeam HotelsBridge`)
                        .then((fullfilled) => {
                            res.json({
                                code: 200,
                                message: "User created successfully."
                            });
                        })
                        .catch((error) => {
                            console.log(`NODEMAILER ERROR: Failed to send informer email...\n${error}`);
                            res.json({
                                code: 200,
                                message: "User account created but failed to send email."
                            })
                        });
                }).catch((error) => {
                    console.log(`Error: Failed to create new user...\n${error}`);
                    res.json({
                        code: 403,
                        message: "Unable to create, please try again later."
                    });
                });
            }

            // if user does exist prevent duplication
            if (user) {
                console.log(`DUPLICATE ACTION PRVENTED: Attempt to create duplicate user with ID: ${user.email}...\n`);
                res.json({
                    code: 403,
                    message: "User with that ID already exists."
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to create non-admin user...\n${error}`);
            res.json({
                code: 403,
                message: "Failed to create: Please check your network connection, inputs and try again."
            });
        });
});

module.exports = router;
