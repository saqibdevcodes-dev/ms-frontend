const db = require("../../database/sql");
const { v4: uuidv4 } = require("uuid");

async function create(request, response) {
  try {
    const { client_id, ranges } = request.body;

    // console.log("Received create request:", {
    //   client_id,
    //   ranges_count: ranges ? ranges.length : 0,
    //   full_body: request.body,
    // });

    console.log("Range details:", JSON.stringify(ranges));

    // Validate input
    if (!client_id) {
      console.log("Error: Missing client_id");
      return response.status(400).json({ message: "Client ID is required." });
    }

    if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
      console.log("Error: Invalid ranges array");
      return response
        .status(400)
        .json({ message: "Ranges are required and cannot be empty." });
    }

    // Get a connection from the db
    const connection = await db.getConnection();
    console.log("Database connection obtained");

    try {
      // Validate client_id exists
      const [clientCheck] = await connection.query(
        `SELECT uuid FROM clients WHERE uuid = ?`,
        [client_id]
      );

      console.log("Client check result:", clientCheck);

      if (clientCheck.length === 0) {
        console.log(
          "Error: Invalid client_id, not found in database:",
          client_id
        );
        return response
          .status(400)
          .json({ message: "Invalid client ID. Client does not exist." });
      }

      console.log("Valid client, proceeding with range processing");

      for (const range of ranges) {
        console.log("Processing range:", range);

        try {
          // Each new range should get a new UUID if not provided
          const uuid = range.uuid || uuidv4();
          console.log("Using UUID for range:", uuid);

          // Always insert as new record
          const [insertResult] = await connection.query(
            `INSERT INTO ranges (uuid, client_id, rating, start, end, color)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuid, client_id, range.rating, range.start, range.end, range.color]
          );

          console.log("Insert result:", insertResult);
          console.log(`Range inserted with ID ${insertResult.insertId}`);
        } catch (rangeError) {
          console.error("Error processing range:", rangeError.message);
          console.error("Range data:", range);
        }
      }

      // Respond with the result
      console.log("All ranges processed successfully");
      return response.status(200).json({
        message: `Ranges saved succesfully!`,
      });
    } catch (mainError) {
      console.error("Main error in create function:", mainError.message);
      return response.status(500).json({ error: mainError.message });
    } finally {
      // Release the connection back to the db
      connection.release();
      console.log("Database connection released");
    }
  } catch (outerError) {
    // Handle errors and respond with a 500 status code
    console.error("Outer error in create function:", outerError.message);
    return response.status(500).json({ error: outerError.message });
  }
}

async function fetch(request, response) {
  try {
    const { client_id } = request.query;

    console.log("Fetch request for client_id:", client_id);

    // Validate client_id is provided
    if (!client_id) {
      console.log("Error: Missing client_id in fetch request");
      return response.status(400).json({
        message: "Client ID is required to fetch ranges.",
      });
    }

    // Get a connection from the db
    const connection = await db.getConnection();
    console.log("Database connection obtained for fetch");

    try {
      // Query the database to fetch ranges filtered by client_id
      const [ranges] = await connection.query(
        "SELECT * FROM ranges WHERE client_id = ?",
        [client_id]
      );

      console.log(`Found ${ranges.length} ranges for client ${client_id}`);

      // Send the filtered ranges as a response
      return response.status(200).json({
        data: ranges,
        message: "Client ranges fetched successfully!",
      });
    } finally {
      // Release the connection back to the pool
      connection.release();
      console.log("Database connection released after fetch");
    }
  } catch (error) {
    console.error("Error fetching ranges:", error.message);

    // Handle errors and send an appropriate response
    return response.status(400).json({
      error: error.message,
      message: "Error fetching ranges!",
    });
  }
}

async function delete_ranges(request, response) {
  try {
    const { range_id } = request.query;

    // Validate input
    if (!range_id) {
      return response.status(400).json({ message: "Response ID is required." });
    }

    // Get a connection from the db
    const connection = await db.getConnection();

    try {
      // Validate if the response exists for the given range_id
      const [existingRanges] = await connection.query(
        `SELECT uuid FROM ranges WHERE uuid = ?`,
        [range_id]
      );

      if (existingRanges.length === 0) {
        return response
          .status(404)
          .json({ message: "Range not found for the given ID." });
      }

      // Perform deletion
      await connection.query(`DELETE FROM ranges WHERE uuid = ?`, [range_id]);

      // Respond with success
      return response.status(200).json({
        message: "Range deleted successfully!",
      });
    } catch (err) {
      // Handle query execution errors
      return response
        .status(500)
        .json({ error: "Failed to delete range.", details: err.message });
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (err) {
    // Handle connection errors or other unexpected errors
    return response
      .status(500)
      .json({ error: "Server error.", details: err.message });
  }
}

async function update_range(request, response) {
  try {
    const { client_id, range } = request.body;

    console.log("Received update request:", {
      client_id,
      range,
    });

    // Validate input
    if (!client_id) {
      console.log("Error: Missing client_id");
      return response.status(400).json({ message: "Client ID is required." });
    }

    if (!range || !range.uuid) {
      console.log("Error: Invalid range data");
      return response
        .status(400)
        .json({ message: "Valid range data is required." });
    }

    // Get a connection from the db
    const connection = await db.getConnection();
    console.log("Database connection obtained for update");

    try {
      // Validate client_id exists
      const [clientCheck] = await connection.query(
        `SELECT uuid FROM clients WHERE uuid = ?`,
        [client_id]
      );

      console.log("Client check result:", clientCheck);

      if (clientCheck.length === 0) {
        console.log(
          "Error: Invalid client_id, not found in database:",
          client_id
        );
        return response
          .status(400)
          .json({ message: "Invalid client ID. Client does not exist." });
      }

      // Check if range exists
      console.log("Checking for range with UUID:", range.uuid);
      const [existingRange] = await connection.query(
        `SELECT * FROM ranges WHERE uuid = ?`,
        [range.uuid]
      );

      console.log("Existing range check result:", existingRange);

      if (existingRange.length === 0) {
        console.log("Error: Range not found");
        return response.status(404).json({ message: "Range not found." });
      }

      // Ensure data types are correct
      const updateValues = [
        String(range.rating),
        Number(range.start),
        Number(range.end),
        String(range.color),
        String(range.uuid),
      ];

      console.log("Update values after conversion:", updateValues);

      // Update the range with simplified SQL - remove client_id check for now
      const updateSQL = `
        UPDATE ranges 
        SET rating = ?, start = ?, end = ?, color = ? 
        WHERE uuid = ?
      `;

      console.log("Executing simplified update SQL:", updateSQL);

      try {
        const [updateResult] = await connection.query(updateSQL, updateValues);

        console.log("Raw update result:", updateResult);
        console.log("Affected rows:", updateResult.affectedRows);

        if (updateResult.affectedRows === 0) {
          console.log("Error: Update failed, no rows affected");
          return response
            .status(400)
            .json({ message: "Update failed, no changes made." });
        }

        // Verify the update was successful by selecting the range again
        const [verifyUpdate] = await connection.query(
          `SELECT * FROM ranges WHERE uuid = ?`,
          [range.uuid]
        );

        console.log("Verification query result:", verifyUpdate);

        // Respond with success
        console.log("Range updated successfully");
        return response.status(200).json({
          message: `Range updated successfully!`,
        });
      } catch (queryError) {
        console.error("Query error:", queryError.message);
        console.error("SQL state:", queryError.sqlState);
        console.error("SQL message:", queryError.sqlMessage);
        return response.status(500).json({
          error: queryError.message,
          sql_state: queryError.sqlState,
          sql_message: queryError.sqlMessage,
        });
      }
    } finally {
      // Release the connection back to the db
      connection.release();
      console.log("Database connection released");
    }
  } catch (error) {
    // Handle errors and respond with a 500 status code
    console.error("Error in update_range:", error.message);
    return response.status(500).json({ error: error.message });
  }
}

const responseController = {
  create,
  fetch,
  delete_ranges,
  update_range,
};

module.exports = responseController;
