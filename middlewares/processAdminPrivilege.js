// this middleware verifies admin token and allow them to perform restricted operations

const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");


const processAdminPrivilege = (req, res, next) => {
    // extracting jwt token from request
    const token = req.header("accessToken");

    if (token) {
        // decode the token
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
                // verify if the profile property is of admin
                if (decodedToken.payload.profile === "admin") {
                    // lookup if the admin is legit
                    Admin.findById({ _id: decodedToken.payload._id })
                        .then((admin) => {
                            if (!admin) {
                                res.json({
                                    code: 403,
                                    message: "Unverified access denied, please log-in and try again."
                                });
                            } else {
                                req.body.adminID = admin._id;
                                req.body.creatorFirstName = admin.firstName;
                                req.body.creatorLastName = admin.lastName;

                                // allow the process
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
                    // preventing non-admin users to access the api
                    res.json({
                        code: 403,
                        message: "You don't have access to perform this operation."
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

module.exports = processAdminPrivilege;
