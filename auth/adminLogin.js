// for admin authentication only
const router = require("express").Router();
const Admin = require("../models/admin");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// rate limit for the admin endpoint
const requestLimitter = rateLimit({
    windowMs: 20 * 60 * 1000, // 20 mins
    max: 10, // Limit each IP to 20 requests per window
    standardHeaders: true, // returns rate limit info in the RateLimit-headers
    legacyHeaders: false, // disabled the "X-RateLimit-*" headers
    message: {
        code: 403,
        message: "Too many login requests from this IP, please try again after 20 minutes"
    }
});


// class for creating JWT payload
class AdminPayload {
    constructor(_id, firstName, lastName, position, profile, phone, email, createdAt, updatedAt) {
        this._id = _id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.position = position;
        this.profile = profile;
        this.phone = phone;
        this.email = email;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

// type = POST
// Operation: Admin Login && Token Creation
// RateLimited: 20 attempts in 20mins.
router.post("/auth/admin/login", requestLimitter, (req, res) => {
    Admin.findOne({ email: req.body.email })
        .then((admin) => {
            // handling if admin is not found
            if (!admin) {
                res.json({
                    code: 403,
                    message: "Invalid log-in credentials"
                });
            }

            // admin exists
            if (admin) {
                // verifying admin credentials && issueing jwt token
                if (bcrypt.compareSync(req.body.password, admin.password)) {
                    const payload = new AdminPayload(admin._id, admin.firstName, admin.lastName, admin.position, admin.profile, admin.phone, admin.email, admin.createdAt, admin.updatedAt);
                    jwt.sign({ payload }, process.env.JWT_SECRET, { expiresIn: "1h" }, (error, token) => {
                        // handling if no token is signed
                        if (error) {
                            console.log(`Error: Failed to sign JWT token for admin login...\n${error}`);
                            res.json({
                                code: 403,
                                message: "Unable to process your login please try again later."
                            });
                        } else {
                            // sending JWT token
                            res.json({
                                code: 200,
                                message: "Logged-in Successfully..",
                                details: {
                                    _id: admin._id,
                                    firstName: admin.firstName,
                                    lastName: admin.lastName,
                                    email: admin.email,
                                    phone: admin.phone,
                                    position: admin.position,
                                    profile: admin.profile,
                                    createdAt: admin.createdAt,
                                    updatedAt: admin.updatedAt
                                },
                                token: token
                            });
                        }
                    });
                } else {
                    // rejecting authentication if password is not identical
                    res.json({
                        code: 403,
                        message: "Invalid log-in credentials, try again."
                    });
                }
            }
        })
        .catch((error) => {
            console.log(`Error: Admin Failed to Login...\n${error}`);
            res.json({
                code: 403,
                message: "Failed to connect: Please check your network, inputs and try again."
            });
        });
});

module.exports = router;
