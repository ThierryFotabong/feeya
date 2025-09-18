const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const twilio = require('twilio');

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Twilio
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Validation schemas
const sendOtpSchema = Joi.object({
  phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required()
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required()
});

// Rate limiting for OTP requests
const otpRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 OTP requests per windowMs
  message: 'Too many OTP requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Store OTP codes in memory (in production, use Redis)
const otpStore = new Map();

// Helper function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to create JWT token
function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// POST /api/auth/send-otp
router.post('/send-otp', otpRateLimit, async (req, res) => {
  try {
    const { error, value } = sendOtpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { phone } = value;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP with expiration
    otpStore.set(phone, {
      code: otp,
      expiresAt,
      attempts: 0
    });

    // Send SMS via Twilio
    try {
      await twilioClient.messages.create({
        body: `Your Feeya verification code is: ${otp}. This code expires in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      res.json({
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 600 // 10 minutes in seconds
      });

    } catch (twilioError) {
      console.error('Twilio error:', twilioError);
      
      // In development, return the OTP for testing
      if (process.env.NODE_ENV === 'development') {
        res.json({
          success: true,
          message: 'OTP sent successfully (development mode)',
          otp: otp, // Only in development
          expiresIn: 600
        });
      } else {
        res.status(500).json({ error: 'Failed to send OTP' });
      }
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { error, value } = verifyOtpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { phone, code } = value;

    // Check if OTP exists and is not expired
    const storedOtp = otpStore.get(phone);
    if (!storedOtp) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    if (new Date() > storedOtp.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Check attempt limit
    if (storedOtp.attempts >= 3) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'Too many failed attempts' });
    }

    // Verify OTP
    if (storedOtp.code !== code) {
      storedOtp.attempts++;
      otpStore.set(phone, storedOtp);
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    // OTP is valid, clean up
    otpStore.delete(phone);

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { phone }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          phone,
          name: 'Guest User', // Will be updated during checkout
          consentFlags: {}
        }
      });
    }

    // Create JWT token
    const token = createToken({
      id: customer.id,
      phone: customer.phone
    });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      customer: {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
        email: customer.email
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const updateSchema = Joi.object({
      name: Joi.string().min(1).max(100).optional(),
      email: Joi.string().email().optional()
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const customer = await prisma.customer.update({
      where: { id: req.user.id },
      data: value,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      customer
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token. For enhanced security, you could
  // implement a token blacklist in Redis.
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Export middleware for use in other routes
router.authenticateToken = authenticateToken;

module.exports = router;
