const {
  up,
} = require("./src/database/migrations/create_password_reset_tokens_table");

/**
 * Run the password reset tokens migration
 */
async function runMigration() {
  try {
    console.log("Running password reset tokens migration...");
    await up();
    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
