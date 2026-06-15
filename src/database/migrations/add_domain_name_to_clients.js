const db = require("../sql");

async function up() {
  try {
    console.log("Adding domain_name column to clients table...");

    // Add domain_name column to clients table
    await db.query(`
      ALTER TABLE clients
      ADD COLUMN domain_name VARCHAR(255) NULL COMMENT 'Domain name for client media URLs'
    `);

    console.log("Successfully added domain_name column to clients table");

    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
}

async function down() {
  try {
    console.log("Removing domain_name column from clients table...");

    // Remove domain_name column from clients table
    await db.query(`
      ALTER TABLE clients
      DROP COLUMN domain_name
    `);

    console.log("Successfully removed domain_name column from clients table");

    return true;
  } catch (error) {
    console.error("Rollback failed:", error);
    return false;
  }
}

module.exports = { up, down };
 