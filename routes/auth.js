const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { generateToken, hashPassword, comparePassword, authenticateToken } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, password, phone, address } = req.body;
    
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);
    const [result] = await pool.query(
      'INSERT INTO users (firstName, middleName, lastName, email, password, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [firstName, middleName, lastName, email, hashedPassword, phone, address]
    );

    const user = { id: result.insertId, email, firstName, middleName, lastName, role: 'patient' };
    const token = generateToken(user);

    res.status(201).json({ token, user: { ...user, phone, address } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await pool.query('SELECT id, firstName, middleName, lastName, email, password, phone, address, role FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, firstName: user.firstName, middleName: user.middleName, lastName: user.lastName, email: user.email, phone: user.phone, address: user.address, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, firstName, middleName, lastName, email, phone, address, role FROM users WHERE id = ?', [req.user.id]);
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, middleName, lastName, phone, address } = req.body;
    await pool.query(
      'UPDATE users SET firstName = ?, middleName = ?, lastName = ?, phone = ?, address = ? WHERE id = ?',
      [firstName, middleName, lastName, phone, address, req.user.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;