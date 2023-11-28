const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    // User information
    userdata: {
        type: String,
        required: true,
    },

    expiry: {
        type: Date, // Expiry timestamp for the OTP
    },
    otp: {
        type: Number // Expiry timestamp for the OTP
    },
});

module.exports = mongoose.model('otp', otpSchema);
