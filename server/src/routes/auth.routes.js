const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, 'PASSENGER', datetime('now'))
    `);

    const result = insertUser.run(name.trim(), email.trim().toLowerCase(), passwordHash);
    const userId = Number(result.lastInsertRowid);

    // Send welcome notification
    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, 'GENERAL', 0, datetime('now'))
    `);
    insertNotif.run(
      userId,
      'Welcome to Railway Passenger Platform',
      'Your account has been registered successfully. Explore trains and plan your journey now!'
    );

    const token = jwt.sign(
      { id: userId, email: email.trim().toLowerCase(), role: 'PASSENGER' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'PASSENGER'
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    const user = db.prepare(`
      SELECT id, name, email, password_hash, role 
      FROM users 
      WHERE LOWER(email) = LOWER(?)
    `).get(email.trim());

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
