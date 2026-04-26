const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [patients] = await pool.query('SELECT * FROM patients');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { patientFirstName, patientMiddleName, patientLastName, email, mobileNumber, address } = req.body;
    const [result] = await pool.query(
      'INSERT INTO patients (patientFirstName, patientMiddleName, patientLastName, email, mobileNumber, address) VALUES (?, ?, ?, ?, ?, ?)',
      [patientFirstName, patientMiddleName, patientLastName, email, mobileNumber, address]
    );
    res.status(201).json({ id: result.insertId, patientFirstName, patientMiddleName, patientLastName, email, mobileNumber, address });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { patientFirstName, patientMiddleName, patientLastName, email, mobileNumber, address } = req.body;
    await pool.query(
      'UPDATE patients SET patientFirstName = ?, patientMiddleName = ?, patientLastName = ?, email = ?, mobileNumber = ?, address = ? WHERE id = ?',
      [patientFirstName, patientMiddleName, patientLastName, email, mobileNumber, address, req.params.id]
    );
    res.json({ message: 'Patient updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
