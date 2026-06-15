/**
 * This script ensures the sessions table exists in the database
 * Run this script directly with Node.js on your production server:
 * node scripts/setup-sessions-table.js
 */

const db = require("../database/sql");

async function setupSessionsTable() {
  console.log("Starting sessions table setup...");

  try {
    // Create sessions table if it doesn't exist
    console.log("Creating/verifying sessions table...");

    await db.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(512) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ Sessions table verified/created");

    // Verify the table structure
    console.log("Verifying sessions table structure...");
    const [columns] = await db.query("DESCRIBE sessions");
    console.log(
      "Sessions table columns:",
      columns.map((col) => col.Field)
    );

    // Check for existing sessions
    const [existingSessions] = await db.query(
      "SELECT COUNT(*) as count FROM sessions"
    );
    console.log(`Found ${existingSessions[0].count} existing sessions`);

    console.log("✅ Sessions table setup complete!");
  } catch (error) {
    console.error("❌ Error setting up sessions table:", error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the setup
setupSessionsTable();
