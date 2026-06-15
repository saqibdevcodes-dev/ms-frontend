const db = require("../../database/sql");
const { v4: uuidv4 } = require("uuid");

async function create(request, response) {
  try {
    const { client_id, responses } = request.body;
    console.log(
      "Creating response with payload:",
      JSON.stringify({ client_id, responses }, null, 2)
    );

    // Validate input
    if (!client_id) {
      return response.status(400).json({ message: "Client ID is required." });
    }

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return response
        .status(400)
        .json({ message: "Responses are required and cannot be empty." });
    }

    // Validate individual responses
    for (const resp of responses) {
      if (resp.response === undefined || resp.response === null) {
        console.warn(
          "Warning: response field is null or undefined, setting to empty string"
        );
        resp.response = "";
      }

      // Make sure numeric fields are numbers
      resp.total_score = Number(resp.total_score) || 0;

      // Set default operation if not provided
      if (!resp.operation) {
        resp.operation = "+";
      }
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
        return response
          .status(400)
          .json({ message: "Invalid client ID. Client does not exist." });
      }

      const savedResponses = [];

      for (const resp of responses) {
        console.log("Processing response:", JSON.stringify(resp, null, 2));

        // Only check for existing response if a UUID is provided
        let existingResponse = [];
        if (resp.uuid) {
          try {
            [existingResponse] = await connection.query(
              "SELECT * FROM responses WHERE uuid = ?",
              [resp.uuid]
            );
            console.log("Existing response check:", existingResponse);
          } catch (queryErr) {
            console.error(
              "Error checking existing response:",
              queryErr.message
            );
            console.error("SQL:", "SELECT * FROM responses WHERE uuid = ?");
            console.error("Params:", [resp.uuid]);
            throw queryErr;
          }
        }

        if (existingResponse && existingResponse.length > 0) {
          console.log("Found existing response, updating...");

          // Update the existing response
          const uuid = resp.uuid;
          try {
            await connection.query(
              `UPDATE responses
              SET total_score = ?, response = ?, operation = ?
              WHERE uuid = ?`,
              [resp.total_score, resp.response, resp.operation || "+", uuid]
            );
            console.log("Updated existing response successfully");
            savedResponses.push({ ...resp, uuid });
          } catch (updateErr) {
            console.error("Error updating response:", updateErr.message);
            console.error("SQL:", "UPDATE responses SET...");
            throw updateErr;
          }
        } else {
          console.log("No existing response found, creating new...");

          // Insert a new response
          const uuid = uuidv4();
          try {
            await connection.query(
              `INSERT INTO responses (uuid, client_id, response, total_score, operation)
               VALUES (?, ?, ?, ?, ?)`,
              [
                uuid,
                client_id,
                resp.response,
                resp.total_score,
                resp.operation || "+",
              ]
            );
            console.log("Inserted new response successfully with UUID:", uuid);
            savedResponses.push({ ...resp, uuid });
          } catch (insertErr) {
            console.error("Error inserting response:", insertErr.message);
            console.error("SQL:", "INSERT INTO responses...");
            throw insertErr;
          }
        }
      }

      // Respond with the result
      console.log("All responses processed successfully");
      return response.status(200).json({
        message: `Responses saved succesfully!`,
        data: savedResponses,
      });
    } catch (err) {
      console.error("Inner error in create function:", err);
      throw err; // Re-throw to be caught by the outer catch
    } finally {
      // Release the connection back to the db
      console.log("Releasing database connection");
      connection.release();
    }
  } catch (err) {
    // Handle errors and respond with a 500 status code
    console.error("Fatal error in create function:", err);
    return response.status(500).json({ error: err.message });
  }
}

async function fetch(request, response) {
  try {
    const { client_id } = request.query;

    // Validate client_id
    if (!client_id) {
      return response.status(400).json({
        message: "Client ID is required to fetch responses.",
      });
    }

    // Query the database to fetch responses for the specific client
    const [responses] = await db.query(
      "SELECT * FROM responses WHERE client_id = ?",
      [client_id]
    );

    // Send the responses as a response
    return response.status(200).json({
      data: responses,
      message:
        responses.length > 0
          ? `Found ${responses.length} responses for this client`
          : "No responses found for this client",
    });
  } catch (error) {
    console.error("Error fetching responses:", error.message);

    // Handle errors and send an appropriate response
    return response.status(400).json({
      error: error.message,
      message: "Error fetching responses!",
    });
  }
}

async function delete_response(request, response) {
  try {
    const { response_id } = request.query;

    // Validate input
    if (!response_id) {
      return response.status(400).json({ message: "Response ID is required." });
    }

    // Get a connection from the db
    const connection = await db.getConnection();

    try {
      // Validate if the response exists for the given response_id
      const [existingResponse] = await connection.query(
        `SELECT uuid FROM responses WHERE uuid = ?`,
        [response_id]
      );

      if (existingResponse.length === 0) {
        return response
          .status(404)
          .json({ message: "Response not found for the given ID." });
      }

      // Perform deletion
      await connection.query(`DELETE FROM responses WHERE uuid = ?`, [
        response_id,
      ]);

      // Respond with success
      return response.status(200).json({
        message: "Response deleted successfully!",
      });
    } catch (err) {
      // Handle query execution errors
      return response
        .status(500)
        .json({ error: "Failed to delete response.", details: err.message });
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

async function update_response(request, response) {
  try {
    const { client_id, response: responseData } = request.body;

    // Validate input
    if (!client_id) {
      return response.status(400).json({ message: "Client ID is required." });
    }

    if (!responseData || !responseData.uuid) {
      return response
        .status(400)
        .json({ message: "Response data and UUID are required." });
    }

    // Get a connection from the db
    const connection = await db.getConnection();

    try {
      // Validate client_id exists
      const [clientCheck] = await connection.query(
        `SELECT uuid FROM clients WHERE uuid = ?`,
        [client_id]
      );

      if (clientCheck.length === 0) {
        return response
          .status(400)
          .json({ message: "Invalid client ID. Client does not exist." });
      }

      // Check if response exists
      const [existingResponse] = await connection.query(
        `SELECT * FROM responses WHERE uuid = ?`,
        [responseData.uuid]
      );

      if (existingResponse.length === 0) {
        return response
          .status(404)
          .json({ message: "Response not found for the given UUID." });
      }

      // Update the response
      await connection.query(
        `UPDATE responses
         SET total_score = ?, response = ?, operation = ?
         WHERE uuid = ?`,
        [
          responseData.total_score || 0,
          responseData.response || "",
          responseData.operation || "+",
          responseData.uuid,
        ]
      );

      // Respond with success
      return response.status(200).json({
        message: "Response updated successfully!",
        data: responseData,
      });
    } catch (err) {
      console.error("Error updating response:", err);
      return response
        .status(500)
        .json({ error: "Failed to update response.", details: err.message });
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (err) {
    console.error("Fatal error in update_response function:", err);
    return response.status(500).json({ error: err.message });
  }
}

const responseController = {
  create,
  fetch,
  delete_response,
  update_response,
};

module.exports = responseController;
