const db = require("../sql");

async function createRangesTableNew() {
  try {
    console.log("Starting new ranges table creation...");

    // Get a connection from the pool
    const connection = await db.getConnection();
    console.log("Database connection established");

    try {
      // Drop the existing table if it exists
      console.log("Dropping any existing ranges table...");
      await connection.query(`DROP TABLE IF EXISTS ranges`);

      // Create the table with proper auto_increment
      console.log("Creating new ranges table...");
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
        ) ENGINE=InnoDB AUTO_INCREMENT=1
      `);

      console.log("New ranges table created successfully");

      // Test insertion
      console.log("Testing table with an insertion...");
      const testUuid = "test-" + Date.now();
      const [insertResult] = await connection.query(
        `
        INSERT INTO ranges (uuid, client_id, rating, start, end, color)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [testUuid, "test-client", "Test Rating", 10, 20, "#000000"]
      );

      console.log("Test insert successful with ID:", insertResult.insertId);

      // Clean up
      await connection.query(`DELETE FROM ranges WHERE uuid = ?`, [testUuid]);
      console.log("Test data cleaned up");

      // Show final table structure
      const [columns] = await connection.query(`DESCRIBE ranges`);
      console.log("Final ranges table structure:");
      columns.forEach((col) => {
        console.log(
          `- ${col.Field} (${col.Type}, ${
            col.Null === "YES" ? "NULL" : "NOT NULL"
          })`
        );
      });

      console.log("Table creation completed successfully");
    } finally {
      // Release the connection back to the pool
      connection.release();
      console.log("Database connection released");
    }
  } catch (error) {
    console.error("Error creating new ranges table:", error.message);
  }
}

// Run the function
createRangesTableNew();
