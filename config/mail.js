require('dotenv').config();

module.exports = {
    MAIL_SETTINGS: {
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        // service: 'gmail',
        auth: {
            user: process.env.MAIL_EMAIL,
            pass: process.env.MAIL_PASSWORD,
        },
    },
};