const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const [services] = await pool.query('SELECT * FROM services WHERE is_active = true');
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, price, duration, image } = req.body;
    const [result] = await pool.query(
      'INSERT INTO services (name, description, price, duration, image) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, duration, image]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, price, duration, image, is_active } = req.body;
    await pool.query(
      'UPDATE services SET name = ?, description = ?, price = ?, duration = ?, image = ?, is_active = ? WHERE id = ?',
      [name, description, price, duration, image, is_active, req.params.id]
    );
    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM services WHERE id = ?', [req.params.id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;