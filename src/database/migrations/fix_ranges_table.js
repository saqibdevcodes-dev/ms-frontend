const db = require("../sql");

async function fixRangesTable() {
  try {
    console.log("Starting ranges table fix migration...");

    // Get a connection from the pool
    const connection = await db.getConnection();
    console.log("Database connection established");

    try {
      console.log("Dropping and recreating ranges table...");

      // Drop the existing table
      await connection.query(`DROP TABLE IF EXISTS ranges`);

      // Create the table with proper auto_increment
      await connection.query(`
        CREATE TABLE ranges (
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
        ) ENGINE=InnoDB
      `);

      console.log("Ranges table recreated successfully");

      // Test insert to verify auto_increment works
      const testUuid = "test-" + Date.now();
      const [insertResult] = await connection.query(
        `
        INSERT INTO ranges (uuid, client_id, rating, start, end, color)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [testUuid, "test-client", "Test Rating", 10, 20, "#000000"]
      );

      console.log("Test insert result:", insertResult);
      console.log(`Test insert ID: ${insertResult.insertId}`);

      // Verify the record was created
      const [testSelect] = await connection.query(
        `
        SELECT * FROM ranges WHERE uuid = ?
      `,
        [testUuid]
      );

      console.log("Test select result:", testSelect);

      // Delete the test record
      await connection.query(
        `
        DELETE FROM ranges WHERE uuid = ?
      `,
        [testUuid]
      );

      console.log("Test record deleted");

      console.log("Fix completed successfully");
    } finally {
      // Release the connection back to the pool
      connection.release();
      console.log("Database connection released");
    }
  } catch (error) {
    console.error("Error in ranges table fix:", error);
  }
}

// Run the fix
fixRangesTable();
