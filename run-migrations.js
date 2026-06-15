// Migration runner script
const fs = require("fs");
const path = require("path");
const db = require("./src/database/sql");

async function runMigration() {
  try {
    console.log("Running migrations...");
    const connection = await db.getConnection();

    try {
      // Create branch_scopes table
      console.log("Creating branch_scopes table...");
      await connection.query(`
        CREATE TABLE IF NOT EXISTS branch_scopes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          client_id VARCHAR(255) NOT NULL,
          scope VARCHAR(255) NOT NULL,
          scope_key VARCHAR(255) NOT NULL,
          essential_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log("branch_scopes table created successfully");

      // Create branch_templates table
      console.log("Creating branch_templates table...");
      await connection.query(`
        CREATE TABLE IF NOT EXISTS branch_templates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          client_id VARCHAR(255) NOT NULL,
          template_name VARCHAR(255) NOT NULL,
          download_url VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log("branch_templates table created successfully");

      // Create report_templates table
      console.log("Creating report_templates table...");
      await connection.query(`
        CREATE TABLE IF NOT EXISTS report_templates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          client_id VARCHAR(255) NOT NULL,
          template_name VARCHAR(255) NOT NULL,
          branch_code VARCHAR(255),
          colors JSON,
          content JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          created_by VARCHAR(255),
          updated_by VARCHAR(255),
          INDEX idx_client_id (client_id),
          INDEX idx_template_name (template_name),
          INDEX idx_branch_code (branch_code)
        )
      `);
      console.log("report_templates table created successfully");

      console.log("All migrations completed successfully!");
    } catch (error) {
      console.error("Error executing migrations:", error);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Database connection error:", error);
  } finally {
    // Close the connection pool
    db.end();
  }
}

// Run the migrations
runMigration();
