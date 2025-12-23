/**
 * Simple auth routes example
 * Matches the structure from your Nodemailer guide
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getDb } = require('../db');
const { generateOtp, hashOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/sendOtpEmail');

const router = express.Router();

/**
 * Registration route - send OTP
 * Matches your guide structure exactly
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, religion, age } = req.body;

    const db = getDb();
    const users = db.collection('users');

    // Check if user exists
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Generate OTP
    const otp = generateOtp();

    // Create user with hashed OTP
    await users.insertOne({
      name,
      email: email.toLowerCase(),
      passwordHash,
      religion,
      age: parseInt(age),
      emailVerified: false,
      emailOtpHash: hashOtp(otp),
      emailOtpExpiry: Date.now() + 10 * 60 * 1000, // 10 minutes
      createdAt: new Date()
    });

    // Send OTP email
    await sendOtpEmail(email, name, otp);

    res.json({
      message: "OTP sent to your email"
    });

  } catch (error) {
    console.error('[Auth Simple] Registration error:', error);
    res.status(500).json({ message: "Registration failed" });
  }
});

/**
 * OTP verification route
 * Matches your guide structure exactly
 */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const db = getDb();
    const users = db.collection('users');

    // Find user
    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.json({ message: "Email already verified" });
    }

    // Check expiry
    if (user.emailOtpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Verify OTP
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== user.emailOtpHash) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update user - mark as verified
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          updatedAt: new Date()
        },
        $unset: {
          emailOtpHash: "",
          emailOtpExpiry: ""
        }
      }
    );

    res.json({ message: "Email verified successfully" });

  } catch (error) {
    console.error('[Auth Simple] OTP verification error:', error);
    res.status(500).json({ message: "Verification failed" });
  }
});

/**
 * Resend OTP route
 */
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const db = getDb();
    const users = db.collection('users');

    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.emailVerified) {
      return res.json({ message: "Email already verified" });
    }

    // Generate new OTP
    const otp = generateOtp();

    // Update user with new OTP
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          emailOtpHash: hashOtp(otp),
          emailOtpExpiry: Date.now() + 10 * 60 * 1000,
          updatedAt: new Date()
        }
      }
    );

    // Send new OTP
    await sendOtpEmail(user.email, user.name, otp);

    res.json({ message: "OTP resent" });

  } catch (error) {
    console.error('[Auth Simple] Resend OTP error:', error);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
});

module.exports = router;