const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const [clinics] = await pool.query('SELECT * FROM clinics WHERE is_active = true');
    res.json(clinics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, address, phone, image, operating_hours } = req.body;
    const [result] = await pool.query(
      'INSERT INTO clinics (name, address, phone, image, operating_hours) VALUES (?, ?, ?, ?, ?)',
      [name, address, phone, image, operating_hours]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, address, phone, image, operating_hours, is_active } = req.body;
    await pool.query(
      'UPDATE clinics SET name = ?, address = ?, phone = ?, image = ?, operating_hours = ?, is_active = ? WHERE id = ?',
      [name, address, phone, image, operating_hours, is_active, req.params.id]
    );
    res.json({ message: 'Clinic updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;