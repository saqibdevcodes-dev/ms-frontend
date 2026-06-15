const mysql = require("mysql2/promise");

async function createRangesTable() {
  console.log("Starting direct ranges table creation...");

  // Create a direct connection without using the existing module
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3307,
    database: "ms",
    user: "root",
    password: "123456789",
  });

  console.log("Connected to database directly");

  try {
    // Drop the existing table if it exists
    console.log("Dropping existing ranges table if it exists...");
    await connection.query("DROP TABLE IF EXISTS ranges");

    // Create the new table
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

    console.log("Ranges table created successfully");

    // Test insert
    const testUuid = "test-" + Date.now();
    console.log("Testing with insert...");
    const [result] = await connection.query(
      "INSERT INTO ranges (uuid, client_id, rating, start, end, color) VALUES (?, ?, ?, ?, ?, ?)",
      [testUuid, "test-client", "Test Rating", 10, 20, "#000000"]
    );

    console.log("Insert result:", result);
    console.log("Inserted ID:", result.insertId);

    // Verify insert
    const [rows] = await connection.query(
      "SELECT * FROM ranges WHERE uuid = ?",
      [testUuid]
    );
    console.log("Selected row:", rows[0]);

    // Return the test UUID for later use
    return testUuid;
  } catch (error) {
    console.error("Error setting up ranges table:", error.message);
    return null;
  } finally {
    // Close connection
    await connection.end();
    console.log("Connection closed");
  }
}

async function updateRangeDirect(testUuid = null) {
  console.log("Starting direct range update test...");

  // Create a direct connection without using the existing module
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3307,
    database: "ms",
    user: "root",
    password: "123456789",
  });

  console.log("Connected to database directly for update test");

  try {
    if (testUuid) {
      console.log("Using provided test UUID:", testUuid);

      // Try to update the range
      console.log("Testing update on the range...");

      const [updateResult] = await connection.query(
        "UPDATE ranges SET rating = ?, start = ?, end = ?, color = ? WHERE uuid = ?",
        ["Updated Rating", 15, 25, "#FF0000", testUuid]
      );

      console.log("Update result:", updateResult);
      console.log("Affected rows:", updateResult.affectedRows);

      // Verify the update
      const [updatedRange] = await connection.query(
        "SELECT * FROM ranges WHERE uuid = ?",
        [testUuid]
      );

      if (updatedRange.length > 0) {
        console.log("Updated range:", updatedRange[0]);
      } else {
        console.log("ERROR: Could not find the updated range");
      }
    } else {
      // First check if any ranges exist
      console.log("Checking for existing ranges...");
      const [ranges] = await connection.query("SELECT * FROM ranges LIMIT 1");

      if (ranges.length === 0) {
        console.log(
          "No ranges found in the database. Creating a test range..."
        );

        // Create a test range
        const newTestUuid = "test-" + Date.now();
        const testClientId = "test-client";

        await connection.query(
          "INSERT INTO ranges (uuid, client_id, rating, start, end, color) VALUES (?, ?, ?, ?, ?, ?)",
          [newTestUuid, testClientId, "Test Rating", 10, 20, "#000000"]
        );

        console.log("Test range created with UUID:", newTestUuid);

        // Now test updating this range
        console.log("Testing update on the new range...");

        const [updateResult] = await connection.query(
          "UPDATE ranges SET rating = ?, start = ?, end = ?, color = ? WHERE uuid = ?",
          ["Updated Rating", 15, 25, "#FF0000", newTestUuid]
        );

        console.log("Update result:", updateResult);
        console.log("Affected rows:", updateResult.affectedRows);

        // Verify the update
        const [updatedRange] = await connection.query(
          "SELECT * FROM ranges WHERE uuid = ?",
          [newTestUuid]
        );

        console.log("Updated range:", updatedRange[0]);
      } else {
        // Update an existing range
        const rangeToUpdate = ranges[0];
        console.log("Found existing range to update:", rangeToUpdate);

        // Try to update the range
        const [updateResult] = await connection.query(
          "UPDATE ranges SET rating = ?, start = ?, end = ?, color = ? WHERE uuid = ?",
          [
            "Updated Rating " + Date.now(),
            rangeToUpdate.start + 1,
            rangeToUpdate.end + 1,
            "#FF0000",
            rangeToUpdate.uuid,
          ]
        );

        console.log("Update result:", updateResult);
        console.log("Affected rows:", updateResult.affectedRows);

        // Verify the update
        const [updatedRange] = await connection.query(
          "SELECT * FROM ranges WHERE uuid = ?",
          [rangeToUpdate.uuid]
        );

        console.log("Updated range:", updatedRange[0]);
      }
    }

    console.log("Direct update test completed");
  } catch (error) {
    console.error("Error in direct update test:", error.message);
  } finally {
    // Close connection
    await connection.end();
    console.log("Connection closed");
  }
}

// Run the functions in sequence
async function runTests() {
  try {
    // First create the table
    const testUuid = await createRangesTable();

    // If table creation succeeded, run update test
    if (testUuid) {
      await updateRangeDirect(testUuid);
    }
  } catch (error) {
    console.error("Error running tests:", error);
  }
}

runTests();
