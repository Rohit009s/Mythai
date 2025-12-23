/**
 * Simple Nodemailer transporter utility
 * Matches the structure from your guide
 */

const nodemailer = require('nodemailer');

// Create and export transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// CommonJS export for compatibility
module.exports = {
  transporter
};