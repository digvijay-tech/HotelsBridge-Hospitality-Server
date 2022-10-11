// log-in route for non-admin users
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../models/user");
const UserActivity = require("../models/activityLog");


// class for creating JWT payload
class UserPayload {
    constructor(_id, firstName, lastName, position, profile, department, isActive, phone, email, createdAt, updatedAt) {
        this._id = _id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.position = position;
        this.profile = profile;
        this.department = department;
        this.isActive = isActive;
        this.phone = phone;
        this.email = email;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

// rate limit for the user log-in endpoint
const requestLimitter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 20, // Limit each IP to 20 requests per window
    standardHeaders: true, // returns rate limit info in the RateLimit-headers
    legacyHeaders: false, // disabled the "X-RateLimit-*" headers
    message: {
        code: 403,
        message: "Too many login requests from this IP, please try again after 20 minutes"
    }
});


// type = POST
// Operation: Non-Admin user login
// RateLimit: 20 attempts in 15mins
router.post("/auth/user/login", requestLimitter, (req, res) => {
    User.findOne({ email: req.body.email })
        .then((user) => {
            // if the user doesn't exist
            if (!user) {
                console.log(`ATTEMPT_PREVENTED: An attempt was made to log-in with unknown email...\n`);
                res.json({
                    code: 403,
                    message: "Invalid log-in credentials, please try again"
                });
            }

            if (user.isActive === true) {
                // user with the given email exist, now checking password
                if (bcrypt.compareSync(req.body.password, user.password)) {
                    const payload = new UserPayload(user._id, user.firstName, user.lastName, user.position, user.profile, user.department, user.isActive, user.phone, user.email, user.createdAt, user.updatedAt);
                    jwt.sign({ payload }, process.env.JWT_SECRET, { expiresIn: "1h" }, (error, token) => {
                        if (error) {
                            console.log(`JWT ERROR: Failed to sign JWT for user log-in...\n${error}`);
                            res.json({
                                code: 403,
                                message: "Unable to process your request, please try later."
                            });
                        } else {
                            // processing user activity log
                            let userName = `${user.firstName} ${user.lastName}`;
                            let activity = `${userName} logged-in using ${req.body.email} email ID.`;

                            UserActivity.create({
                                userName: userName,
                                activity: activity
                            }).then((success) => {
                                // processing log-in
                                if (!success) {
                                    res.json({
                                        code: 403,
                                        message: "Failed to log user activity."
                                    });
                                }
            
                                if (success) {
                                    // sending jwt
                                    res.json({
                                        code: 200,
                                        message: "Logged-in Successfully..",
                                        details: {
                                            _id: user._id,
                                            firstName: user.firstName,
                                            lastName: user.lastName,
                                            email: user.email,
                                            phone: user.phone,
                                            position: user.position,
                                            department: user.department,
                                            profile: user.profile,
                                            createdAt: user.createdAt,
                                            updatedAt: user.updatedAt,
                                            createBy: user.createdBy
                                        },
                                        token: token
                                    });
                                }
                            }).catch((error) => {
                                console.log(`Error: Failed to log user activity in the DB for user login..\n${error}`);
                                res.json({
                                    code: 403,
                                    message: "Failed to log user activity, if you're not logged-in please try later."
                                });
                            });
                        }
                    });
                } else {
                    // rejecting authentication if password is not identical
                    res.json({
                        code: 403,
                        message: "Invalid log-in credentials"
                    });
                }
            } else {
                // rejecting authentication if account status is not active
                res.json({
                    code: 403,
                    message: "Your account is not active, please contact your manager."
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to process log-in request for non-admin user...\n${error}`);
        });
});


module.exports = router;
