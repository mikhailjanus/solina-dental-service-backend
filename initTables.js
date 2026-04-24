const mysql = require('mysql2/promise');
require('dotenv').config();

const initializeTables = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Creating database tables...');

    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(100) NOT NULL,
        middleName VARCHAR(100),
        lastName VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        role ENUM('patient', 'admin') DEFAULT 'patient',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    // Services table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        duration INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Services table created');

    // Clinics table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clinics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(20),
        opening_hours VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Clinics table created');

    // Appointments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        service_id INT NOT NULL,
        clinic_id INT NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (service_id) REFERENCES services(id),
        FOREIGN KEY (clinic_id) REFERENCES clinics(id)
      )
    `);
    console.log('✓ Appointments table created');

     // Insert default admin user
     const [adminExists] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin@dental.com']);
     if (adminExists.length === 0) {
       const bcrypt = require('bcryptjs');
       const hashedPassword = await bcrypt.hash('admin123', 10);
       await connection.query(
         'INSERT INTO users (firstName, middleName, lastName, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
         ['Admin', '', 'STR', 'admin@dental.com', hashedPassword, 'admin']
       );
       console.log('✓ Default admin user created (admin@dental.com / admin123)');
     }

    await connection.end();
    console.log('\n✅ All tables initialized successfully!');

  } catch (error) {
    console.error('Error initializing tables:', error);
    process.exit(1);
  }
};

initializeTables();