const db = require("../sql");

async function createRangesTable() {
  try {
    console.log("Starting ranges table migration...");

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
        console.log("Ranges table does not exist! Creating it...");

        // Create the ranges table if it doesn't exist
        await connection.query(`
          CREATE TABLE IF NOT EXISTS ranges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uuid VARCHAR(36) NOT NULL,
            client_id VARCHAR(36) NOT NULL,
            rating VARCHAR(100) NOT NULL,
            start DECIMAL(10,2) NOT NULL,
            end DECIMAL(10,2) NOT NULL,
            color VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY (uuid),
            INDEX (client_id)
          )
        `);
        console.log("Ranges table created successfully");
      } else {
        console.log("Ranges table already exists");

        // Display the current structure
        const [columns] = await connection.query(`
          SHOW COLUMNS FROM ranges
        `);

        console.log("Ranges table columns:");
        columns.forEach((column) => {
          console.log(
            `- ${column.Field} (${column.Type}, ${
              column.Null === "YES" ? "NULL" : "NOT NULL"
            })`
          );
        });
      }

      console.log("Migration completed successfully");
    } finally {
      // Release the connection back to the pool
      connection.release();
      console.log("Database connection released");
    }
  } catch (error) {
    console.error("Error in ranges table migration:", error);
  }
}

// Run the migration
createRangesTable();
