const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [income] = await pool.query(`
      SELECT i.*, a.appointment_date, CONCAT_WS(' ', u.firstName, u.middleName, u.lastName) as patient_name, s.name as service_name
      FROM income i
      JOIN appointments a ON i.appointment_id = a.id
      JOIN users u ON a.user_id = u.id
      JOIN services s ON a.service_id = s.id
      ORDER BY i.payment_date DESC
    `);
    res.json(income);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/summary', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [totalIncome] = await pool.query('SELECT SUM(amount) as total FROM income');
    const [monthlyIncome] = await pool.query(`
      SELECT MONTH(payment_date) as month, SUM(amount) as total 
      FROM income 
      WHERE YEAR(payment_date) = YEAR(CURDATE())
      GROUP BY MONTH(payment_date)
    `);
    const [todayIncome] = await pool.query('SELECT SUM(amount) as today FROM income WHERE DATE(payment_date) = CURDATE()');
    
    res.json({
      total: totalIncome[0].total || 0,
      today: todayIncome[0].today || 0,
      monthly: monthlyIncome
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/dashboard-stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [totalAppointments] = await pool.query('SELECT COUNT(*) as total FROM appointments');
    const [pendingAppointments] = await pool.query('SELECT COUNT(*) as pending FROM appointments WHERE status = "pending"');
    const [totalPatients] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = "patient"');
    const [totalServices] = await pool.query('SELECT COUNT(*) as total FROM services WHERE is_active = true');
    
    res.json({
      totalAppointments: totalAppointments[0].total,
      pendingAppointments: pendingAppointments[0].pending,
      totalPatients: totalPatients[0].total,
      totalServices: totalServices[0].total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;