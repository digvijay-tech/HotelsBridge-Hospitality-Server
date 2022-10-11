// for admin password update only
const router = require("express").Router();
const Admin = require("../models/admin");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const moment = require("moment");


// custom middlewares
const processAdminPrivilege = require("../middlewares/processAdminPrivilege");


// utility module
const { INFORMER_EMAIL } = require("../utility/mailer");


// rate limit for the admin endpoint
const requestLimitter = rateLimit({
    windowMs: 20 * 60 * 1000, // 20 mins
    max: 5, // Limit each IP to 5 requests per window
    standardHeaders: true, // returns rate limit info in the RateLimit-headers
    legacyHeaders: false, // disabled the "X-RateLimit-*" headers
    message: {
        code: 403,
        message: "Too many login requests from this IP, please try again after 20 minutes"
    }
});


// type = PUT
// Operation: Admin Password Update & Alert
// RateLimited: 5 attempts in 20mins.
router.put("/auth/admin/passwordUpdate", requestLimitter, processAdminPrivilege, (req, res) => {
    Admin.findById({ _id: req.body.userID })
        .then((admin) => {
            // if there is no admin object
            if (!admin) {
                console.log(`Alert: No Admin found for password update operation..\n`);
                res.json({
                    code: 403,
                    message: "Failed to authenticate please log-in again."
                });
            }

            if (admin) {
                // if there is admin object, compare passwords
                if (bcrypt.compareSync(req.body.oldPassword, admin.password)) {
                    Admin.findByIdAndUpdate({ _id: admin._id }, { password: bcrypt.hashSync(req.body.newPassword, 10) })
                        .then((result) => {
                            if (result) {
                                const body= `Dear ${result.firstName},\n\nYour HotelsBridge account password was updated recently. If this wasn't you please report the incident to 'digvijay.padhiyar@hotelsbridge.com' as soon as possible.\n\nDATE AND TIME: ${moment().format("MMMM Do YYYY, h:mm:ss a")}\n\nDO NOT REPLY TO THIS EMAIL.\n\nkind regards,\nTeam HotelsBridge `;
                                
                                // sending informer email to alert the admin about update
                                INFORMER_EMAIL(result.email, "Security Alert: Password Updated", body)
                                    .then((fullfilled) => {
                                        res.json({
                                            code: 200,
                                            message: "Updated successfully please login again."
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
                        .catch((error) => {
                            console.log(`Error: Unable to update password for ${admin.email}..\n${error}`);
                            res.json({
                                code: 403,
                                message: "Failed to update your password, please try again later."
                            });
                        });
                } else {
                    // incorrect password
                    res.json({
                        code: 403,
                        message: "Your old password is incorrect."
                    });
                }
            }
        })
        .catch((error) => {
            console.log(`Error: Failed to find the Admin for password update..${error}`);
            res.json({
                code: 403,
                message: "Unable to verify your identity, please log-in again."
            });
        });
});


module.exports = router;
