const db = require("./sql");

async function checkRangesTable() {
  try {
    console.log("Checking ranges table contents...");

    // Get a connection from the pool
    const connection = await db.getConnection();
    console.log("Database connection established");

    try {
      // Check if ranges table exists
      console.log("Verifying ranges table exists...");
      const [tables] = await connection.query(`
        SHOW TABLES LIKE 'ranges'
      `);

      if (tables.length === 0) {
        console.log("ERROR: Ranges table does not exist!");
        return;
      }

      // Check table structure
      console.log("Checking ranges table structure...");
      const [columns] = await connection.query(`
        DESCRIBE ranges
      `);

      console.log("Ranges table columns:");
      columns.forEach((column) => {
        console.log(
          `- ${column.Field} (${column.Type}, ${
            column.Null === "YES" ? "NULL" : "NOT NULL"
          })`
        );
      });

      // Count records
      const [countResult] = await connection.query(`
        SELECT COUNT(*) as count FROM ranges
      `);

      const count = countResult[0].count;
      console.log(`Total ranges in table: ${count}`);

      if (count > 0) {
        // Get the records
        const [ranges] = await connection.query(`
          SELECT * FROM ranges
          LIMIT 100
        `);

        console.log("Ranges data:");
        ranges.forEach((range, index) => {
          console.log(`\nRange #${index + 1}:`);
          console.log(`- UUID: ${range.uuid}`);
          console.log(`- Client ID: ${range.client_id}`);
          console.log(`- Rating: ${range.rating}`);
          console.log(`- Start: ${range.start}`);
          console.log(`- End: ${range.end}`);
          console.log(`- Color: ${range.color}`);
          console.log(`- Created at: ${range.created_at}`);
        });
      } else {
        console.log("No ranges found in the table.");
      }
    } finally {
      // Release the connection back to the pool
      connection.release();
      console.log("Database connection released");
    }
  } catch (error) {
    console.error("Error checking ranges table:", error);
  }
}

// Run the check
checkRangesTable();
