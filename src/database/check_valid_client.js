const db = require("./sql");

async function checkValidClient() {
  try {
    console.log("Starting client validation check...");

    // Get a connection from the pool
    const connection = await db.getConnection();
    console.log("Database connection established");

    try {
      // 1. Check if clients table exists
      console.log("Checking for clients table...");
      const [clientTable] = await connection.query(`
        SHOW TABLES LIKE 'clients'
      `);

      if (clientTable.length === 0) {
        console.error("ERROR: Clients table does not exist!");
        return;
      }

      console.log("Clients table exists");

      // 2. Get list of valid client UUIDs
      console.log("Getting list of valid client UUIDs...");
      const [clients] = await connection.query(`
        SELECT uuid, name FROM clients
        LIMIT 10
      `);

      if (clients.length === 0) {
        console.error("ERROR: No clients found in the database!");
        return;
      }

      console.log("Valid clients:");
      clients.forEach((client) => {
        console.log(`- ${client.name}: ${client.uuid}`);
      });

      // 3. Check specific client ID (replace with the one from your payload)
      const clientIdToCheck = "f041e609-5ef9-4108-84e3-a6a5f0c90bec"; // This is the client ID from your payload
      console.log(`\nChecking if client ID exists: ${clientIdToCheck}`);

      const [clientCheck] = await connection.query(
        `
        SELECT uuid, name FROM clients WHERE uuid = ?
      `,
        [clientIdToCheck]
      );

      if (clientCheck.length === 0) {
        console.error(
          `ERROR: Client ID ${clientIdToCheck} does not exist in the database!`
        );
        console.log("Please use one of the valid client IDs listed above.");
      } else {
        console.log(
          `SUCCESS: Client ID ${clientIdToCheck} is valid! (${clientCheck[0].name})`
        );

        // 4. Try to insert a test response with this valid client ID
        console.log("\nTesting insert with valid client ID...");
        const testUuid = "test-" + Date.now();
        try {
          const [insertResult] = await connection.query(
            `
            INSERT INTO responses (uuid, client_id, response, total_score, applicable_score, achieved_score, operation)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
            [testUuid, clientIdToCheck, "Test Response", 10, 10, 5, "+"]
          );

          console.log("Test insert SUCCESS:", insertResult);

          // Clean up test data
          console.log("Cleaning up test data...");
          await connection.query(
            `
            DELETE FROM responses WHERE uuid = ?
          `,
            [testUuid]
          );
        } catch (insertError) {
          console.error("Test insert FAILED:", insertError.message);
        }
      }

      console.log("\nClient validation check completed");
    } finally {
      // Release the connection back to the pool
      connection.release();
      console.log("Database connection released");
    }
  } catch (error) {
    console.error("Error checking client validity:", error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the check
checkValidClient();
