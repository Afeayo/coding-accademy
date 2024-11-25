const express = require('express');
const router = express.Router();
const Student = require('../models/students');
const nodemailer = require('nodemailer');
const paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);

const otpStore = {}; // In-memory storage for OTPs

// GET enrollment form
router.get('/', (req, res) => {
    res.render('enrollment');
});

// POST enrollment form (OTP generation)
router.post('/', async (req, res) => {
    const { name, email, phone } = req.body;

    try {
        const existingStudent = await Student.findOne({ $or: [{ email }, { phone }] });
        if (existingStudent) {
            return res.status(400).send(`${name} Email number already exists`);
        }
        const existingStudentPhone = await Student.findOne({ $or: [{ email }, { phone }] });
        if (existingStudentPhone) {
            return res.status(400).send(`${name} Phone number already exists`);
        }
        

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = otp;

        const transporter = nodemailer.createTransport({
            host: 'smtp.us.appsuite.cloud',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: 'info@eventushersconference.com.ng',
            to: email,
            subject: 'Your OTP for Enrollment Verification',
            text: `${name}, your OTP code is ${otp}. Use this to complete your enrollment.`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Email send error:", err);
                return res.status(500).send("Failed to send OTP");
            } else {
                res.render('otp-verification', { email });
            }
        });
    } catch (error) {
        console.error("Enrollment error:", error);
        res.status(500).send("Server error during enrollment");
    }
});

// POST OTP verification
router.post('/verify', (req, res) => {
    const { email, otp } = req.body;

    if (otpStore[email] && otpStore[email] === otp) {
        delete otpStore[email];
        res.redirect(`/enrollment/initiate?email=${email}`);
    } else {
        res.status(400).send("Invalid OTP");
    }
});

// Payment initiation route
router.get('/initiate', (req, res) => {
    const { email } = req.query;
    res.render('payment-initiate', { email, paystackKey: process.env.PAYSTACK_PUBLIC_KEY });
});

router.post('/confirm-payment', async (req, res) => {
    const { email, name, phone } = req.body;

    if (!email) {
        console.error("No email provided in request body");
        return res.status(400).send("Email is required for confirmation.");
    }

    try {
        const newStudent = new Student({
            name,
            email,
            phone,
            paymentVerified: true,
            otpVerified: true,
        });

        await newStudent.save();

        const transporter = nodemailer.createTransport({
            host: 'smtp.us.appsuite.cloud',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: 'info@eventushersconference.com.ng',
            to: email,
            subject: 'Payment Successful',
            text: "Congratulations! Your payment has been successfully processed. You can now log in to access your dashboard."
        };

        console.log("Sending confirmation email to:", email);

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Confirmation email send error:", err);
            } else {
                console.log("Confirmation email sent:", info.response);
            }
        });

        res.json({ success: true, message: "Payment and registration successful." });
    } catch (error) {
        console.error("Error confirming payment and saving student:", error);
        res.status(500).send("Server error during registration confirmation.");
    }
});

module.exports = router;
