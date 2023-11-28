const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/user');

const app = express();

// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const { phoneNumber, email } = req.body;
        // Generate and send OTP (via SMS or email)

        // Save OTP and its expiry in the database
        const otp = generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 5); // OTP expires in 5 minutes

        const user = new User({
            phoneNumber,
            email,
            otp,
            otpExpiry,
        });

        await user.save();
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// OTP Verification Route
router.post('/verify-otp', async (req, res) => {
    try {
        const { phoneNumber, email, otp } = req.body;
        // Find the user by phoneNumber or email and check the OTP

        const user = await User.findOne({ $or: [{ phoneNumber }, { email }] });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp !== otp || new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Mark the user as verified
        user.verified = true;
        await user.save();

        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// User Login Route
router.post('/login', async (req, res) => {
    try {
        const { phoneNumber, email, password } = req.body;
        // Find the user by phoneNumber or email and check the password

        const user = await User.findOne({ $or: [{ phoneNumber }, { email }] });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.verified) {
            return res.status(401).json({ message: 'User not verified' });
        }

        // Check password (you should use a library like bcrypt for password hashing)

        // Generate a JWT token and send it to the client for authenticated requests

        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Helper function to generate OTP (simplified, you may use a library)
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}
