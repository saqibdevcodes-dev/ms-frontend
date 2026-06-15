const db = require("../sql");

async function up() {
  try {
    console.log("Adding custom label columns to clients table...");

    // Add custom label columns to clients tables
    await db.query(`
      ALTER TABLE clients
      ADD COLUMN branch_label VARCHAR(100) DEFAULT 'Branch' COMMENT 'Custom label for branch terminology',
      ADD COLUMN visit_date_label VARCHAR(100) DEFAULT 'Date of Visit' COMMENT 'Custom label for visit date terminology',
      ADD COLUMN branch_report_label VARCHAR(100) DEFAULT 'Branch Report' COMMENT 'Custom label for branch report terminology',
      ADD COLUMN total_branches_label VARCHAR(100) DEFAULT 'Total Branches' COMMENT 'Custom label for total branches terminology',
      ADD COLUMN completed_branches_label VARCHAR(100) DEFAULT 'Completed Branches' COMMENT 'Custom label for completed branches terminology',
      ADD COLUMN my_reports_label VARCHAR(100) DEFAULT 'My Branch Reports' COMMENT 'Custom label for my reports terminology'
    `);

    console.log("Successfully added custom label columns to clients table");

    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
}

async function down() {
  try {
    console.log("Removing custom label columns from clients table...");

    // Remove custom label columns from clients table
    await db.query(`
      ALTER TABLE clients
      DROP COLUMN branch_label,
      DROP COLUMN visit_date_label,
      DROP COLUMN branch_report_label,
      DROP COLUMN total_branches_label,
      DROP COLUMN completed_branches_label,
      DROP COLUMN my_reports_label
    `);

    console.log("Successfully removed custom label columns from clients table");

    return true;
  } catch (error) {
    console.error("Rollback failed:", error);
    return false;
  }
}

module.exports = { up, down }; 