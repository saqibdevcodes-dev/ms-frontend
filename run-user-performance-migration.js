// User Performance Migration Runner
const {
  up,
} = require("./src/database/migrations/create_user_performance_table");

/**
 * Run the user performance table migration
 */
async function runMigration() {
  try {
    console.log("Running user performance table migration...");

    // Execute the migration
    await up();

    console.log("User performance table migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
