const db = require("./sql");

async function checkDatabaseTables() {
  try {
    console.log("Starting database table check...");

    // Get a connection from the pool
    const connection = await db.getConnection();
    console.log("Database connection established");

    try {
      // Check for responses table
      console.log("Checking for responses table...");
      const [tables] = await connection.query(`
        SHOW TABLES LIKE 'responses'
      `);

      if (tables.length === 0) {
        console.log("WARNING: Responses table does not exist!");

        // Create the responses table if it doesn't exist
        console.log("Creating responses table...");
        await connection.query(`
          CREATE TABLE IF NOT EXISTS responses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uuid VARCHAR(36) NOT NULL,
            client_id VARCHAR(36) NOT NULL,
            response TEXT,
            total_score DECIMAL(10,2) DEFAULT 0,
            applicable_score DECIMAL(10,2) DEFAULT 0,
            achieved_score DECIMAL(10,2) DEFAULT 0,
            operation VARCHAR(10) DEFAULT '+',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY (uuid),
            INDEX (client_id)
          )
        `);
        console.log("Responses table created successfully");
      } else {
        console.log("Responses table exists");

        // Check the structure of the responses table
        console.log("Checking responses table structure...");
        const [columns] = await connection.query(`
          SHOW COLUMNS FROM responses
        `);

        console.log("Responses table columns:");
        columns.forEach((column) => {
          console.log(
            `- ${column.Field} (${column.Type}, ${
              column.Null === "YES" ? "NULL" : "NOT NULL"
            })`
          );
        });
      }

      // Test inserting a record
      console.log("Testing insert into responses table...");
      const testUuid = "test-" + Date.now();
      const [insertResult] = await connection.query(
        `
        INSERT INTO responses (uuid, client_id, response, total_score, applicable_score, achieved_score, operation)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [testUuid, "test-client", "Test Response", 10, 10, 5, "+"]
      );

      console.log("Insert test result:", insertResult);

      // Clean up test data
      console.log("Cleaning up test data...");
      await connection.query(
        `
        DELETE FROM responses WHERE uuid = ?
      `,
        [testUuid]
      );

      console.log("Database check completed successfully");
    } finally {
      // Release the connection back to the pool
      connection.release();
      console.log("Database connection released");
    }
  } catch (error) {
    console.error("Error checking database tables:", error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the check
checkDatabaseTables();
