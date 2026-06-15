const db = require("../sql");

async function updateRangesTable() {
  try {
    console.log("Starting ranges table update migration...");

    // Get a connection from the pool
    const connection = await db.getConnection();
    console.log("Database connection established");

    try {
      // Check for ranges table
      console.log("Checking for ranges table...");
      const [tables] = await connection.query(`
        SHOW TABLES LIKE 'ranges'
      `);

      if (tables.length === 0) {
        console.log(
          "ERROR: Ranges table does not exist! Please run create_ranges_table.js first."
        );
        return;
      }

      console.log("Updating the ranges table structure...");

      // Update the columns to the correct types
      await connection.query(`
        ALTER TABLE ranges 
        MODIFY rating VARCHAR(100) NOT NULL,
        MODIFY start DECIMAL(10,2) NOT NULL,
        MODIFY end DECIMAL(10,2) NOT NULL,
        MODIFY color VARCHAR(50) NOT NULL;
      `);

      console.log("Ranges table updated successfully");

      // Display the updated structure
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM ranges
      `);

      console.log("Updated ranges table columns:");
      columns.forEach((column) => {
        console.log(
          `- ${column.Field} (${column.Type}, ${
            column.Null === "YES" ? "NULL" : "NOT NULL"
          })`
        );
      });

      console.log("Migration completed successfully");
    } finally {
      // Release the connection back to the pool
      connection.release();
      console.log("Database connection released");
    }
  } catch (error) {
    console.error("Error in ranges table update migration:", error);
  }
}

// Run the migration
updateRangesTable();
