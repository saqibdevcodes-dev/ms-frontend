const db = require("../sql");

/**
 * Create password_reset_tokens table
 * This table will store password reset tokens generated when users request a password reset
 */
async function up() {
  try {
    // Check if the table already exists
    const [tables] = await db.query("SHOW TABLES LIKE 'password_reset_tokens'");

    if (tables.length > 0) {
      console.log("Table 'password_reset_tokens' already exists.");
      return;
    }

    // Create the password_reset_tokens table
    await db.query(`
      CREATE TABLE password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("Table 'password_reset_tokens' created successfully.");
  } catch (error) {
    console.error("Error creating 'password_reset_tokens' table:", error);
    throw error;
  }
}

/**
 * Drop password_reset_tokens table
 */
async function down() {
  try {
    // Check if the table exists before dropping
    const [tables] = await db.query("SHOW TABLES LIKE 'password_reset_tokens'");

    if (tables.length === 0) {
      console.log("Table 'password_reset_tokens' does not exist.");
      return;
    }

    // Drop the table
    await db.query("DROP TABLE password_reset_tokens");

    console.log("Table 'password_reset_tokens' dropped successfully.");
  } catch (error) {
    console.error("Error dropping 'password_reset_tokens' table:", error);
    throw error;
  }
}

module.exports = { up, down };
