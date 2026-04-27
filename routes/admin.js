const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

  router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
      const [income] = await pool.query(`
        SELECT i.*, a.appointment_date, CONCAT_WS(' ', p.patient_firstname, p.patient_middlename, p.patient_lastname) as patient_name, s.name as service_name
        FROM income i
        JOIN appointments a ON i.appointment_id = a.id
        JOIN patients p ON a.patient_id = p.id
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
    const [confirmedAppointments] = await pool.query('SELECT COUNT(*) as confirmed FROM appointments WHERE status = "confirmed"');
    const [completedAppointments] = await pool.query('SELECT COUNT(*) as completed FROM appointments WHERE status = "completed"');
    const [cancelledAppointments] = await pool.query('SELECT COUNT(*) as cancelled FROM appointments WHERE status = "cancelled"');
    const [totalPatients] = await pool.query('SELECT COUNT(*) as total FROM patients');
    const [totalServices] = await pool.query('SELECT COUNT(*) as total FROM services WHERE is_active = true');
    
    res.json({
      totalAppointments: totalAppointments[0].total,
      pendingAppointments: pendingAppointments[0].pending,
      confirmedAppointments: confirmedAppointments[0].confirmed,
      completedAppointments: completedAppointments[0].completed,
      cancelledAppointments: cancelledAppointments[0].cancelled,
      totalPatients: totalPatients[0].total,
      totalServices: totalServices[0].total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;