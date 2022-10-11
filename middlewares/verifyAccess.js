// for verifying the user accessing any endpoints on the server
const Admin = require("../models/admin");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const verifyAccess = (req, res, next) => {
    // extracting jwt from header
    const token = req.header("accessToken");

    if (token) {
        // decoding JWT token
        jwt.verify(token, process.env.JWT_SECRET, (error, decodedToken) => {
            // handling jwt error
            if (error) {
                console.log(`JWT Error: Unable to decode the AccessToken for Admin Privilege...\n${error}`);
                res.json({
                    code: 403,
                    message: "Authentication failed, please log-in again."
                });
            }

            if (decodedToken) {
                if (decodedToken.payload.profile === "admin") {
                    // checking for admin access
                    Admin.findById({ _id: decodedToken.payload._id })
                        .then((admin) => {
                            if (!admin) {
                                res.json({
                                    code: 403,
                                    message: "Unverified access denied, please log-in and try again."
                                });
                            } else {
                                // attach verified user admin details
                                req.body.decodedUser = admin;

                                // allow the process to go on
                                next();
                            }
                        })
                        .catch((error) => {
                            console.log(`ACTION PREVENTED: AN ATTEMPT CREATE USER WITHOUT ADMIN PRIVILEGE...\n${error}`);
                            res.json({
                                code: 403,
                                message: "Authorization failed, please log-in and try again."
                            });
                        });
                } else {
                    // checking for legit user access
                    User.findById({ _id: decodedToken.payload._id })
                        .then((user) => {
                            if (!user) {
                                res.json({
                                    code: 403,
                                    message: "Unverified access denied, please log-in and try again."
                                });
                            } else {
                                // confirm if the user has an active account
                                if (user.isActive === false) {
                                    res.json({
                                        code: 403,
                                        message: "Your account is deactivated, please contact your manager."
                                    });
                                } else {
                                    // attach verified user details
                                    req.body.decodedUser = user;

                                    // allow the process to go on
                                    next();
                                }
                            }
                        })
                        .catch((error) => {
                            console.log(`ACTION PREVENTED: AN ATTEMPT CREATE USER WITHOUT ADMIN PRIVILEGE...\n${error}`);
                            res.json({
                                code: 403,
                                message: "Authorization failed, please log-in and try again."
                            });
                        });
                }
            }
        });
    } else {
        // if no access token is found in headers
        res.json({
            code: 403,
            message: "Session expired please log-in again."
        });
    }
}

module.exports = verifyAccess;
