const db = require("../sql");

/**
 * Update user_performance table to make report_id part of the primary key
 * Note: report_id is already part of the primary key as per the original migration,
 * but this script includes additional checks to verify or fix it if needed.
 */
async function up() {
  try {
    // Check if the table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'user_performance'");

    if (tables.length === 0) {
      console.log("Table 'user_performance' does not exist, skipping update.");
      return;
    }

    // Get current table information
    const [tableInfo] = await db.query(`
      SHOW KEYS FROM user_performance 
      WHERE Key_name = 'PRIMARY'
    `);

    // Check if the primary key already includes report_id
    const reportIdInPrimaryKey = tableInfo.some(
      (key) => key.Column_name === "report_id"
    );

    if (reportIdInPrimaryKey) {
      console.log(
        "report_id is already part of the primary key for user_performance table."
      );
      return;
    }

    // Drop existing primary key and constraints
    await db.query(`
      ALTER TABLE user_performance 
      DROP PRIMARY KEY,
      DROP FOREIGN KEY user_performance_ibfk_1,
      DROP FOREIGN KEY user_performance_ibfk_2
    `);

    // Add primary key back including report_id (redundant since it was already included,
    // but in case it got changed or there's an issue with the schema)
    await db.query(`
      ALTER TABLE user_performance 
      ADD PRIMARY KEY (client_id, user_id, report_id),
      ADD CONSTRAINT user_performance_ibfk_1 FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      ADD CONSTRAINT user_performance_ibfk_2 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `);

    console.log(
      "Primary key of 'user_performance' table updated successfully."
    );
  } catch (error) {
    console.error(
      "Error updating primary key for 'user_performance' table:",
      error
    );
    throw error;
  }
}

/**
 * Revert changes if needed (this is a no-op since we're not changing the
 * intended structure from the original migration)
 */
async function down() {
  // No need to do anything as the structure is already correct
  console.log("No rollback needed for primary key update.");
}

module.exports = { up, down };
