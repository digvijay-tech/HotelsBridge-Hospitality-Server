// different email templates as functions
const nodemailer = require("nodemailer");

// SMTP transporter
let transporter = nodemailer.createTransport({
    host: process.env.NC_HOST_ADDRESS,
    port: 465,
    secure: true,
    auth: {
        user: process.env.NC_MAIL_ID,
        pass: process.env.NC_PASSWORD
    },
});

// A simple text only email for informing users
const INFORMER_EMAIL = async (email, subject, message) => {
    // Sending email with defined template
    let details = await transporter.sendMail({
        from: process.env.NC_MAIL_ID,
        to: email,
        subject: subject,
        text: message,
    });

    console.log("Message Sent: %", details.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(details));
}

module.exports = {
    INFORMER_EMAIL
}
