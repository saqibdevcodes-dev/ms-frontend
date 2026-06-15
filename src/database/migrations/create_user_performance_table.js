const db = require("../sql");

/**
 * Create user_performance table
 * This table will store performance metrics for users when reports are added
 */
async function up() {
  try {
    // Check if the table already exists
    const [tables] = await db.query("SHOW TABLES LIKE 'user_performance'");

    if (tables.length > 0) {
      console.log("Table 'user_performance' already exists.");

      // Modify the status column to include 'draft' value
      try {
        await db.query(`
          ALTER TABLE user_performance 
          MODIFY COLUMN status ENUM('completed', 'pending', 'rejected', 'draft') NOT NULL DEFAULT 'completed'
        `);
        console.log("Modified status column to include 'draft' value");
      } catch (alterError) {
        console.error("Error modifying status column:", alterError);
      }

      return;
    }

    // Create the user_performance table
    await db.query(`
      CREATE TABLE user_performance (
        client_id INT NOT NULL,
        user_id INT NOT NULL,
        report_id INT NOT NULL,
        report_name VARCHAR(255) NOT NULL,
        report_time INT NOT NULL COMMENT 'Time in minutes to complete the report',
        status ENUM('completed', 'pending', 'rejected', 'draft') NOT NULL DEFAULT 'completed',
        score DECIMAL(5,2) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (client_id, user_id, report_id),
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX (created_at),
        INDEX (report_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("Table 'user_performance' created successfully.");
  } catch (error) {
    console.error("Error creating 'user_performance' table:", error);
    throw error;
  }
}

/**
 * Drop user_performance table
 */
async function down() {
  try {
    // Check if the table exists before dropping
    const [tables] = await db.query("SHOW TABLES LIKE 'user_performance'");

    if (tables.length === 0) {
      console.log("Table 'user_performance' does not exist.");
      return;
    }

    // Drop the table
    await db.query("DROP TABLE user_performance");

    console.log("Table 'user_performance' dropped successfully.");
  } catch (error) {
    console.error("Error dropping 'user_performance' table:", error);
    throw error;
  }
}

module.exports = { up, down };
