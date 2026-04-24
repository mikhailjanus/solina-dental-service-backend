CREATE DATABASE IF NOT EXISTS dental_service;
USE dental_service;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role ENUM('patient', 'admin') DEFAULT 'patient',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration INT NOT NULL COMMENT 'Duration in minutes',
  image VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  image VARCHAR(255),
  operating_hours TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  service_id INT NOT NULL,
  clinic_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  notes TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('pending', 'paid') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

CREATE TABLE IF NOT EXISTS income (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50),
  notes TEXT,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE IF NOT EXISTS time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  day_of_week INT NOT NULL COMMENT '0=Sunday, 1=Monday, ..., 6=Saturday',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

INSERT IGNORE INTO users (name, email, password, role) VALUES 
('Admin', 'admin@dental.com', '$2a$10$EixZaY3d7g8M/.r15b6V/.GJ3eK7fH2eJd7fK3eJd7fK3eJd7fK3e', 'admin');

INSERT IGNORE INTO services (name, description, price, duration) VALUES 
('General Checkup', 'Comprehensive dental examination including oral cancer screening, gum health check, and teeth cleaning recommendation.', 50.00, 30),
('Teeth Cleaning', 'Professional dental cleaning to remove plaque, tartar, and stains. Includes polishing and fluoride treatment.', 80.00, 45),
('Tooth Filling', 'Restorative procedure to repair cavities using composite resin material matching natural tooth color.', 120.00, 60),
('Root Canal Treatment', 'Endodontic treatment to remove infected pulp and save a severely damaged tooth.', 350.00, 90),
('Teeth Whitening', 'Professional in-office teeth whitening procedure for brighter, whiter smile.', 200.00, 60),
('Dental Implants', 'Surgical placement of artificial tooth roots to replace missing teeth.', 1500.00, 120),
('Orthodontics/Braces', 'Orthodontic treatment to align and straighten teeth using traditional braces.', 2500.00, 60),
('Dental Crown', 'Custom-made tooth cap to restore damaged tooth shape, size, and strength.', 450.00, 90);

INSERT IGNORE INTO clinics (name, address, phone, operating_hours) VALUES 
('Main Dental Clinic', '123 Healthcare Avenue, Medical District', '555-0101', 'Monday-Friday: 9AM-6PM, Saturday: 9AM-2PM'),
('Downtown Dental Center', '456 Business Park, Suite 100', '555-0102', 'Monday-Friday: 8AM-7PM, Saturday: 10AM-4PM');