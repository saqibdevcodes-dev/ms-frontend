const db = require("../sql");

async function addOperationToResponses() {
  try {
    console.log("Starting migration: add_operation_to_responses");

    // Check if the operation column already exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'responses' AND COLUMN_NAME = 'operation'
    `);

    // If column doesn't exist, add it
    if (columns.length === 0) {
      console.log("Adding operation column to responses table...");
      await db.query(`
        ALTER TABLE responses
        ADD COLUMN operation VARCHAR(10) DEFAULT '+' NOT NULL
      `);
      console.log("Operation column added successfully");
    } else {
      console.log("Operation column already exists, skipping migration");
    }

    console.log("Migration completed: add_operation_to_responses");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Execute the migration
addOperationToResponses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
