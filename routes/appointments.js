const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const moment = require('moment');

router.get('/', authenticateToken, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'admin') {
       query = `
         SELECT
         a.id,
         a.first_name as patientFirstName,
         a.middle_name as patientMiddleName,
         a.last_name as patientLastName,
         a.mobile_number,
         a.address as patientAddress,
         a.total_amount,
         a.appointment_date,
         a.appointment_time,
         a.status,
         s.name as serviceName,
         s.duration as serviceDuration,
         c.name as clinicName,
         c.address as clinicAddress
       FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN clinics c ON a.clinic_id = c.id
      ORDER BY a.id DESC
      `;
      params = [];
    } /* else {
      query = `
        SELECT a.*, s.name as service_name, s.price as service_price, c.name as clinic_name
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        JOIN clinics c ON a.clinic_id = c.id
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `;
      params = [];
    }*/
    
    const [appointments] = await pool.query(query, params);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      service_id,
      clinic_id,
      appointment_date,
      appointment_time,
      notes,
      patientFirstName,
      patientMiddleName,
      patientLastName,
      address,
      phone
    } = req.body;
    
    const [existing] = await pool.query(
      'SELECT id FROM appointments WHERE clinic_id = ? AND appointment_date = ? AND appointment_time = ? AND status != "cancelled"',
      [clinic_id, appointment_date, appointment_time]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    const [services] = await pool.query('SELECT price FROM services WHERE id = ?', [service_id]);
    const total_amount = services[0].price;

    const [result] = await pool.query(
      `INSERT INTO appointments 
        (user_id, service_id, clinic_id, first_name, middle_name, last_name, address, mobile_number, appointment_date, appointment_time, notes, total_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        service_id,
        clinic_id,
        patientFirstName,
        patientMiddleName || '',
        patientLastName,
        address,
        phone,
        appointment_date,
        appointment_time,
        notes,
        total_amount
      ]
    );

    res.status(201).json({ 
      id: result.insertId,
      total_amount: total_amount,
      message: 'Appointment booked successfully' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      patientFirstName,
      patientMiddleName,
      patientLastName,
      address,
      phone,
      clinic_id,
      service_id,
      appointment_date,
      appointment_time,
      notes,
      total_amount
    } = req.body;
    
    const [existing] = await pool.query(
      'SELECT id FROM appointments WHERE clinic_id = ? AND appointment_date = ? AND appointment_time = ? AND status != "cancelled" AND id != ?',
      [clinic_id, appointment_date, appointment_time, req.params.id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    await pool.query(
      `UPDATE appointments 
       SET first_name = ?, 
           middle_name = ?, 
           last_name = ?, 
           address = ?,
           phone = ?, 
           clinic_id = ?, 
           service_id = ?, 
           appointment_date = ?, 
           appointment_time = ?, 
           notes = ?, 
           total_amount = ? 
       WHERE id = ?`,
      [
        patientFirstName,
        patientMiddleName,
        patientLastName,
        address,
        phone,
        clinic_id,
        service_id,
        appointment_date,
        appointment_time,
        notes,
        total_amount,
        req.params.id
      ]
    );

    res.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    
    if (status === 'completed') {
      const [appointments] = await pool.query('SELECT total_amount FROM appointments WHERE id = ?', [req.params.id]);
      await pool.query(
        'INSERT INTO income (appointment_id, amount) VALUES (?, ?)',
        [req.params.id, appointments[0].total_amount]
      );
    }
    
    res.json({ message: 'Appointment status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/available-slots', async (req, res) => {
  try {
    const { clinic_id, date } = req.query;
    const dayOfWeek = moment(date).day();
    
    const [bookedSlots] = await pool.query(
      'SELECT appointment_time FROM appointments WHERE clinic_id = ? AND appointment_date = ? AND status != "cancelled"',
      [clinic_id, date]
    );
    
    const bookedTimes = bookedSlots.map(s => s.appointment_time.toString().substring(0, 5));
    
    const workingHours = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];
    
    const availableSlots = workingHours.map(time => ({
      time,
      available: !bookedTimes.includes(time)
    }));
    
    res.json(availableSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;