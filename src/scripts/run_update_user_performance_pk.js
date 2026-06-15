#!/usr/bin/env node

const {
  up,
} = require("../database/migrations/update_user_performance_primary_key");
const db = require("../database/sql");

// Run the migration
(async () => {
  try {
    console.log("Starting user_performance primary key update migration...");
    await up();
    console.log("Migration completed successfully!");

    // Close the DB connection pool
    await db.end();
    console.log("Database connection closed.");

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);

    // Try to close the DB connection even if the migration failed
    try {
      await db.end();
      console.log("Database connection closed.");
    } catch (dbErr) {
      console.error("Error closing database connection:", dbErr);
    }

    process.exit(1);
  }
})();
