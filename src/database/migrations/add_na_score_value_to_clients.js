const db = require("../sql");

async function up() {
  try {
    console.log("Adding na_score_value column to clients table...");

    await db.query(`
      ALTER TABLE clients
      ADD COLUMN na_score_value VARCHAR(50) DEFAULT '0'
      COMMENT 'Value shown for N/A responses in applicable and achieved score columns'
    `);

    console.log("Successfully added na_score_value column to clients table");
    return true;
  } catch (error) {
    if (error.code === "ER_DUP_FIELDNAME") {
      console.log("na_score_value column already exists, skipping");
      return true;
    }
    console.error("Migration failed:", error);
    return false;
  }
}

async function down() {
  try {
    await db.query(`
      ALTER TABLE clients
      DROP COLUMN na_score_value
    `);
    return true;
  } catch (error) {
    console.error("Rollback failed:", error);
    return false;
  }
}

module.exports = { up, down };
