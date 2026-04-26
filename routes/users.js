const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, firstName, middleName, lastName, email, phone, address, role, created_at FROM users'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, firstName, middleName, lastName, email, phone, address, role, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a user
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, phone, address, role } = req.body;
    
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query(
      'UPDATE users SET firstName = ?, middleName = ?, lastName = ?, email = ?, phone = ?, address = ?, role = ? WHERE id = ?',
      [firstName, middleName, lastName, email, phone, address, role, req.params.id]
    );
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a user
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;