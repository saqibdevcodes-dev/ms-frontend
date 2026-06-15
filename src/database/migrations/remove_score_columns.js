const db = require("../sql");

async function removeScoreColumns() {
  try {
    console.log("Starting migration: remove_score_columns");

    // Get a connection from the pool
    const connection = await db.getConnection();
    console.log("Database connection established");

    try {
      // Check if the applicable_score column exists
      console.log("Checking for applicable_score column...");
      const [appScoreColumns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'responses' AND COLUMN_NAME = 'applicable_score'
      `);

      // If column exists, remove it
      if (appScoreColumns.length > 0) {
        console.log("Removing applicable_score column...");
        await connection.query(`
          ALTER TABLE responses
          DROP COLUMN applicable_score
        `);
        console.log("applicable_score column removed successfully");
      } else {
        console.log("applicable_score column does not exist, skipping");
      }

      // Check if the achieved_score column exists
      console.log("Checking for achieved_score column...");
      const [achScoreColumns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'responses' AND COLUMN_NAME = 'achieved_score'
      `);

      // If column exists, remove it
      if (achScoreColumns.length > 0) {
        console.log("Removing achieved_score column...");
        await connection.query(`
          ALTER TABLE responses
          DROP COLUMN achieved_score
        `);
        console.log("achieved_score column removed successfully");
      } else {
        console.log("achieved_score column does not exist, skipping");
      }

      console.log("Migration completed: remove_score_columns");
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
removeScoreColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
