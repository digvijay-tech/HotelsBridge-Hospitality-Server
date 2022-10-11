// for managing non-admin user's profiles
const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const User = require("../models/user");
const Admin = require("../models/admin");
const UserActivity = require("../models/activityLog");

// custom middlewares
const processAdminPrivilege = require("../middlewares/processAdminPrivilege");
const verifyAccess = require("../middlewares/verifyAccess");


// utility module
const { INFORMER_EMAIL } = require("../utility/mailer");


// rate limit middleware for '/api/profile/fetchAll' endpoint
const rateLimiterForGET = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 50, // Limit each IP to 50 requests per window
    standardHeaders: true, // returns rate limit info in the RateLimit-headers
    legacyHeaders: false, // disabled the "X-RateLimit-*" headers
    message: {
        code: 403,
        message: "Too many login requests from this IP, please try again after 10 minutes"
    }
});

// rate limit middleware for '/api/profile/updateStatus' endpoint
const rateLimiterForPUT = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 mins
    max: 30, // Limit each IP to 30 requests per window
    standardHeaders: true, // returns rate limit info in the RateLimit-headers
    legacyHeaders: false, // disabled the "X-RateLimit-*" headers
    message: {
        code: 403,
        message: "Too many login requests from this IP, please try again after 5 minutes"
    }
});

// rate limit middleware for '/api/profile/passwordUpdate' endpoint
const rateLimiterForPasswordUpdate = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 2, // Limit each IP to 2 requests per window
    standardHeaders: true, // returns rate limit info in the RateLimit-headers
    legacyHeaders: false, // disabled the "X-RateLimit-*" headers
    message: {
        code: 403,
        message: "Too many login requests from this IP, please try again after 10 minutes"
    }
});

// rate limit middleware for '/api/profile/delete' endpoint
const rateLimiterForDELETE = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 mins
    max: 10, // Limit each IP to 10 requests per window
    standardHeaders: true, // returns rate limit info in the RateLimit-headers
    legacyHeaders: false, // disabled the "X-RateLimit-*" headers
    message: {
        code: 403,
        message: "Too many login requests from this IP, please try again after 5 minutes"
    }
});


// type = GET
// Operation: For retriving non-admin users from the database
// RateLimit: 50 attempts in 10mins.
router.get("/api/profile/fetchAll", rateLimiterForGET, processAdminPrivilege, (req, res) => {
    User.find()
        .then((profiles) => {
            if (!profiles) {
                res.json({
                    code: 403,
                    message: "Unable to find profiles, please try again later."
                });
            }

            if (profiles) {
                // filtering out the passwords
                const filteredProfiles = profiles.map((profile) => {
                    return {
                        _id: profile._id,
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        profile: profile.profile,
                        position: profile.position,
                        department: profile.department,
                        phone: profile.phone,
                        email: profile.email,
                        createdAt: profile.createdAt,
                        updatedAt: profile.updatedAt,
                        isActive: profile.isActive,
                        createdBy: profile.createdBy
                    }
                });
                
                res.json({
                    code: 200,
                    message: "Everything is up to date..",
                    profiles: filteredProfiles.reverse()
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to fetch the non-admin users from database...\n${error}`);
            res.json({
                code: 403,
                message: "Unable to fetch profiles, please try again later."
            });
        });
});


// type = PUT
// Operation: For updating user account status
// RateLimit: 30 attempts in 5mins.
router.put("/api/profile/updateStatus", rateLimiterForPUT, processAdminPrivilege, (req, res) => {
    User.findByIdAndUpdate({ _id: req.body._id }, { isActive: req.body.isActive })
        .then((profile) => {
            if (!profile) {
                res.json({
                    code: 403,
                    message: "Unable to find the user, please try later."
                });
            }

            if (profile) {
                console.log("Updated:::::", profile);
                res.json({
                    code: 200,
                    message: "User updated successfully."
                });
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to find non-admin user while updating 'isActive' prop...\n${error}'`);
            res.json({
                code: 403,
                message: "Unable to update user, please try logging-in again."
            });
        });
});


// type = PUT
// Operation: For updating user's password with accessToken
// RateLimit: 2 attempts in 10mins.
// UserActivityLogs: YES
router.put("/api/profile/passwordUpdate", rateLimiterForPasswordUpdate, verifyAccess, (req, res) => {
    User.findById({ _id: req.body.userID })
        .then((user) => {
            if (!user) {
                console.log("Error: Unable to file the user for password update..");
                res.json({
                    code: 403,
                    message: "Unable to update your password please try later."
                });
            }

            if (user) {
                // check oldPassword if it matches with the one in the DB
                if (bcrypt.compareSync(req.body.oldPassword, user.password)) {
                    User.findByIdAndUpdate({ _id: req.body.userID }, { password: bcrypt.hashSync(req.body.newPassword, 10) })
                        .then((result) => {
                            if (!result) {
                                console.log("Error: Unable to update password..");
                                res.json({
                                    code: 403,
                                    message: "Unable to update your password please try later."
                                });
                            }

                            if (result) {
                                const body= `Dear ${result.firstName},\n\nYour HotelsBridge account password was updated recently. If this wasn't you please report the incident to 'digvijay.padhiyar@hotelsbridge.com' as soon as possible.\n\nDATE AND TIME: ${moment().format("MMMM Do YYYY, h:mm:ss a")}\n\nDO NOT REPLY TO THIS EMAIL.\n\nkind regards,Team HotelsBridge ` ;
                                
                                // sending informer email to alert the user about update
                                INFORMER_EMAIL(result.email, "Security Alert: Password Updated", body)
                                    .then((fullfilled) => {
                                        // processing user activity log
                                        let userName = `${result.firstName} ${result.lastName}`;
                                        let activity = `Password was updated for ${result.email}`;

                                        UserActivity.create({
                                            userName: userName,
                                            activity: activity
                                        }).then((success) => {
                                            if (!success) {
                                                res.json({
                                                    code: 403,
                                                    message: "Failed to log activity, if you're logged-out that means your password is updated."
                                                });
                                            }

                                            if (success) {
                                                res.json({
                                                    code: 200,
                                                    message: "Updated successfully please login again."
                                                });
                                            }
                                        }).catch((error) => {
                                            console.log(`Error: Failed to log user activity for updating password..${error}`);
                                            res.json({
                                                code: 403,
                                                message: "Failed to log user activity, if you receive an email or you're logged-off that means your password is updated."
                                            });
                                        });
                                        
                                    })
                                    .catch((error) => {
                                        console.log(`Failed to send security alert email...\n${error}`);
                                        res.json({
                                            code: 200,
                                            message: "Password Updated successfully but failed to send security alert."
                                        });
                                    });
                            }
                        })
                } else {
                    res.json({
                        code: 403,
                        message: "Your old password is incorrect."
                    });
                }
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to find the user for password update..\n${error}`);
            res.json({
                code: 403,
                message: "Failed to verify your identity please login again."
            });
        });
});


// type = DELETE
// Operation: For deleting user account with admin authentication
// RateLimit: 10 attempts in 5mins.
router.delete("/api/profile/delete", rateLimiterForDELETE, processAdminPrivilege, (req, res) => {
    console.log(req.body);

    // find the admin and compare the password
    Admin.findById({ _id: req.body.adminID })
        .then((admin) => {
            if (!admin) {
                res.json({
                    code: 403,
                    message: "unable to verify your identity, please re-login and try later."
                });
            }

            if (admin) {
                // comparing password
                if (bcrypt.compareSync(req.body.password, admin.password)) {
                    User.findByIdAndDelete({ _id: req.body.userID })
                        .then((result) => {
                            if (!result) {
                                console.log(`Error: Unable to find the user account for deleting..`);
                                res.json({
                                    code: 403,
                                    message: "Failed to perform the action, please verify the details and try again."
                                });
                            } else {
                                // creating body string for email
                                const body = `Dear ${admin.firstName},\n\n We'd like to inform you that your credentials were used to delete the account of ${result.firstName} ${result.lastName}.\n\nDATE AND TIME: ${moment().format("MMMM Do YYYY, h:mm:ss a")}\n\nIf this wasn't you please report the incident to this email digvijay.padhiyar@hotelsbridge.com right away.\n\nDO NOT REPLY TO THIS EMAIL.\n\nkind regards,\nTeam HotelsBridge`; 
                                
                                // send informer email
                                INFORMER_EMAIL(admin.email, "Security Alert", body)
                                    .then((fullfilled) => {
                                        res.json({
                                            code: 200,
                                            message: "User Account Deleted.."
                                        });
                                    })
                                    .catch((error) => {
                                        console.log(`Failed to send security alert email...\n${error}`);
                                        res.json({
                                            code: 200,
                                            message: "Account deleted successfully, failed to send security alert."
                                        });
                                    });
                            }
                        })
                } else {
                    res.json({
                        code: 403,
                        message: "Invalid Admin Credentials"
                    });
                }
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to find the admin for account delete operation...\n${error}`);
            res.json({
                code: 403,
                message: "Unable to authenticate operation, please re-login and try later."
            });
        });
});


module.exports = router;
