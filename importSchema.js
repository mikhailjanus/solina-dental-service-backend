const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const importSchema = async () => {
  try {
    console.log('Reading schema.sql file...');
    const schemaContent = fs.readFileSync('./database/schema.sql', 'utf8');
    
    // Split into individual statements
    const statements = schemaContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('Importing schema and sample data...');
    
    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (err) {
        // Ignore duplicate table errors
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }
    }

    await connection.end();
    console.log('✅ Schema and sample data imported successfully!');
    console.log('\nSample data added:');
    console.log('- 8 default dental services');
    console.log('- 2 clinic locations');
    console.log('- Default admin account (admin@dental.com / admin123)');

  } catch (error) {
    console.error('❌ Error importing schema:', error.message);
    process.exit(1);
  }
};

importSchema();