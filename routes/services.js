const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM services';
    let params = [];
    
    if (status === 'active') {
      query += ' WHERE is_active = true';
    } else if (status === 'inactive') {
      query += ' WHERE is_active = false';
    }
    
    const [services] = await pool.query(query, params);
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, price_range_from, price_range_to, image, is_active } = req.body;
    const [result] = await pool.query(
      'INSERT INTO services (name, description, price_range_from, price_range_to, image, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, parseFloat(price_range_from), parseFloat(price_range_to), image || null, is_active !== undefined ? parseInt(is_active) : 1]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    console.error('POST /services error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, price_range_from, price_range_to, image, is_active } = req.body;
    await pool.query(
      'UPDATE services SET name = ?, description = ?, price_range_from = ?, price_range_to = ?, image = ?, is_active = ? WHERE id = ?',
      [name, description, parseFloat(price_range_from), parseFloat(price_range_to), image, parseInt(is_active), req.params.id]
    );
    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('PUT /services/:id error:', error.message);
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