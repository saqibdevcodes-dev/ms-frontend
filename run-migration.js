// Run migration script
const migration = require("./src/database/migrations/add_custom_labels_to_clients.js");

async function runMigration() {
  console.log("Running migration to add custom labels to clients table...");

  try {
    const result = await migration.up();

    if (result) {
      console.log("Migration successful!");
    } else {
      console.error("Migration failed");
    }
  } catch (error) {
    console.error("Error running migration:", error);
  }
}

runMigration();
