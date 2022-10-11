// filtering all the request with legit Unique Room Code
const Rooms = require("../models/room");


const URCGuard = (req, res, next) => {
    // if URC found
    if (!req.query.urc) {
        res.json({
            code: 403,
            message: "Please scan the QR code and try again."
        });
    }

    if (req.query.urc) {
        // validate URC
        Rooms.findOne({ urc: req.query.urc })
            .then((room) => {
                if (!room) {
                    res.json({
                        code: 403,
                        message: "Failed to authenticate please re-scan the QR code."
                    });
                }

                if (room) {
                    req.body.roomNumber = room.roomNumber;
                    next();
                }
            })
            .catch((error) => {
                console.log(`Error: Failed to validate URC...${error}`);
                res.json({
                    code: 403,
                    message: "Room authentication failed, please re-scan the QR code or contact reception."
                });
            });
    }
}


module.exports = URCGuard;
