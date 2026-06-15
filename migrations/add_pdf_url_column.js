/**
 * Migration script to add pdf_url column to all client-specific reports tables
 * Run this script to add PDF URL support to existing tables
 * 
 * Usage: node migrations/add_pdf_url_column.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addPdfUrlColumn() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'mystery_shopping'
    });

    console.log('Connected to database');

    // Get all tables that end with _reports (client-specific tables)
    const [tables] = await connection.query(
      `SELECT TABLE_NAME 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME LIKE '%_reports'`
    );

    console.log(`Found ${tables.length} client reports tables`);

    // Add pdf_url column to each table
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      try {
        // Check if pdf_url column already exists
        const [columns] = await connection.query(
          `SELECT COLUMN_NAME 
           FROM information_schema.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = ? 
           AND COLUMN_NAME = 'pdf_url'`,
          [tableName]
        );

        if (columns.length === 0) {
          // Column doesn't exist, add it
          await connection.query(
            `ALTER TABLE \`${tableName}\` ADD COLUMN pdf_url TEXT AFTER timestamp_url`
          );
          console.log(`✅ Added pdf_url column to ${tableName}`);
        } else {
          console.log(`⏭️  pdf_url column already exists in ${tableName}`);
        }
      } catch (error) {
        console.error(`❌ Error processing table ${tableName}:`, error.message);
      }
    }

    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
addPdfUrlColumn();





