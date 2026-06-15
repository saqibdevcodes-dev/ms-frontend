const db = require("../sql");

async function updateTotalScoreTypeToDecimal() {
  try {
    console.log("Starting migration: update_total_score_to_decimal");

    // Get a connection from the pool
    const connection = await db.getConnection();
    console.log("Database connection established");

    try {
      // Check the current type of total_score column
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'responses' AND COLUMN_NAME = 'total_score'
      `);

      if (columns.length === 0) {
        console.log("total_score column not found in responses table");
        return;
      }

      const currentType = columns[0].DATA_TYPE;
      console.log(`Current type of total_score: ${currentType}`);

      // If the column is not already DECIMAL, change it
      if (currentType.toLowerCase() !== "decimal") {
        console.log("Changing total_score to DECIMAL(10,2)...");
        await connection.query(`
          ALTER TABLE responses
          MODIFY COLUMN total_score DECIMAL(10,2) DEFAULT 0.00
        `);
        console.log("total_score type changed to DECIMAL(10,2) successfully");
      } else {
        console.log("total_score is already a DECIMAL type, no change needed");
      }

      console.log("Migration completed: update_total_score_to_decimal");
    } finally {
      // Release the connection back to the pool
      connection.release();
      console.log("Database connection released");
    }
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Execute the migration
updateTotalScoreTypeToDecimal()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
