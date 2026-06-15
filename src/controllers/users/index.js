const db = require("../../database/sql");
const { sendUserCredentialsEmail } = require("../../utils/mail");

function parseClientIds(clientIdValue) {
  if (!clientIdValue) return [];
  if (Array.isArray(clientIdValue)) {
    return [...new Set(clientIdValue.map((id) => String(id).trim()).filter(Boolean))];
  }
  if (typeof clientIdValue === "string") {
    const trimmed = clientIdValue.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.map((id) => String(id).trim()).filter(Boolean))];
      }
    } catch (error) {
      // Keep support for non-JSON legacy client_id values.
    }
    if (trimmed.includes(",")) {
      return [...new Set(trimmed.split(",").map((id) => id.trim()).filter(Boolean))];
    }
    return [trimmed];
  }
  return [String(clientIdValue).trim()].filter(Boolean);
}

function serializeClientIds(clientIds) {
  const normalized = parseClientIds(clientIds);
  if (!normalized.length) return "";
  if (normalized.length === 1) return normalized[0];
  return JSON.stringify(normalized);
}

let clientUsersSchemaCache = null;

async function getClientUsersSchema(connection) {
  if (clientUsersSchemaCache) {
    return clientUsersSchemaCache;
  }

  const [columns] = await connection.query("SHOW COLUMNS FROM client_users");

  if (!columns.length) {
    throw new Error("Missing expected columns in client_users table.");
  }

  const availableColumns = columns.map((column) => column.Field);
  const preferredOrder = ["user_id", "user_uuid", "uuid"];
  const resolvedUserColumn =
    preferredOrder.find((columnName) => availableColumns.includes(columnName)) ||
    null;

  if (!resolvedUserColumn) {
    throw new Error(
      "Missing user reference column in client_users table. Expected one of: user_id, user_uuid, uuid."
    );
  }

  clientUsersSchemaCache = {
    userColumn: resolvedUserColumn,
    hasEmailColumn: availableColumns.includes("email"),
    hasRoleColumn: availableColumns.includes("role"),
  };
  return clientUsersSchemaCache;
}

// async function fetch(request, response) {
//   try {
//     // Get page and limit from query parameters, with default values
//     const page = parseInt(request.query.page, 10) || 1;
//     const limit = parseInt(request.query.limit, 10) || 100;


//     // Calculate the offset
//     const offset = (page - 1) * limit;

//     // Query the database to fetch users with pagination without the WHERE clause
//     const [users] = await db.query("SELECT * FROM users LIMIT ? OFFSET ?", [
//       limit,
//       offset,
//     ]);

//     // Query the database to get the total count of users
//     const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM users");

//     // Send the users and pagination data as a response
//     return response.status(200).json({
//       data: users,
//       pagination: {
//         total,
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//       },
//       message: "Users fetched successfully!",
//     });
//   } catch (error) {
//     console.error("Error fetching users:", error.message);

//     // Handle errors and send an appropriate response
//     return response.status(400).json({
//       error: error.message,
//       message: "Error fetching users!",
//     });
//   }
// }

async function fetch(request, response) {
  try {
    // Query the database to fetch all users
    const [users] = await db.query("SELECT * FROM users");

    // Send the users and total count as a response
    return response.status(200).json({
      data: users,
      total: users.length,
      message: "Users fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);

    // Handle errors and send an appropriate response
    return response.status(400).json({
      error: error.message,
      message: "Error fetching users!",
    });
  }
}


async function get_user(request, response) {
  try {
    const { id } = request.params;

    // Check if ID is provided
    if (!id) {
      return response.status(400).json({ message: "User ID is required." });
    }

    // Query the database to fetch the specific user with client details
    const [users] = await db.query(
      `SELECT u.*, c.name as client_name, c.email as client_email, c.first_name as client_first_name, c.last_name as client_last_name
       FROM users u
       LEFT JOIN clients c ON u.client_id = c.uuid
       WHERE u.uuid = ?`,
      [id]
    );

    // Check if user exists
    if (users.length === 0) {
      return response.status(404).json({ message: "User not found." });
    }

    // Send the user data as a response
    return response.status(200).json({
      data: users[0],
      message: "User fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching user:", error.message);

    // Handle errors and send an appropriate response
    return response.status(400).json({
      error: error.message,
      message: "Error fetching user!",
    });
  }
}

async function update_user(request, response) {
  try {
    const { id } = request.params;
    const updateData = request.body;

    // Check if ID is provided
    if (!id) {
      return response.status(400).json({ message: "User ID is required." });
    }

    // Get a connection from the database
    const connection = await db.getConnection();

    try {
      // If email is being updated, check if it's already in use by another user of the same client
      if (updateData.email) {
        // First, get the current user's client_id
        const [currentUser] = await connection.query(
          "SELECT client_id FROM users WHERE uuid = ?",
          [id]
        );

        if (currentUser.length === 0) {
          return response.status(404).json({ message: "User not found." });
        }

        const clientId = currentUser[0].client_id;

        // Now check for duplicate emails only within that client
        const [existingUsers] = await connection.query(
          "SELECT * FROM users WHERE email = ? AND uuid != ? AND client_id = ?",
          [updateData.email, id, clientId]
        );

        if (existingUsers.length > 0) {
          return response.status(400).json({
            message:
              "Email address is already in use by another user in this client.",
          });
        }
      }

      // If client_id is being updated, verify that the new client exists
      if (updateData.client_id) {
        const [clientCheck] = await connection.query(
          "SELECT * FROM clients WHERE uuid = ?",
          [updateData.client_id]
        );

        if (clientCheck.length === 0) {
          return response.status(400).json({
            message: "Invalid client_id. The specified client does not exist.",
          });
        }

        // Update system_role to client_user if client_id is provided
        updateData.system_role = "client_user";
      }

      // Start building the SQL query dynamically based on provided fields
      let sql = "UPDATE users SET ";
      const values = [];
      const updateFields = [];

      // Add fields to update
      if (updateData.first_name) {
        updateFields.push("first_name = ?");
        values.push(updateData.first_name);
      }

      if (updateData.last_name) {
        updateFields.push("last_name = ?");
        values.push(updateData.last_name);
      }

      if (updateData.email) {
        updateFields.push("email = ?");
        values.push(updateData.email);
      }

      if (updateData.phone) {
        updateFields.push("phone = ?");
        values.push(updateData.phone);
      }

      if (updateData.role) {
        updateFields.push("role = ?");
        values.push(updateData.role);
      }

      if (updateData.client_id) {
        updateFields.push("client_id = ?");
        values.push(updateData.client_id);
      }

      if (updateData.system_role) {
        updateFields.push("system_role = ?");
        values.push(updateData.system_role);
      }

      // Update name field (combination of first and last name)
      if (updateData.first_name || updateData.last_name) {
        // First get the current user data
        const [currentUser] = await connection.query(
          "SELECT first_name, last_name FROM users WHERE uuid = ?",
          [id]
        );

        if (currentUser.length > 0) {
          const firstName =
            updateData.first_name || currentUser[0].first_name || "";
          const lastName =
            updateData.last_name || currentUser[0].last_name || "";
          const fullName = `${firstName} ${lastName}`.trim();

          updateFields.push("name = ?");
          values.push(fullName);
        }
      }

      // If no fields to update, return
      if (updateFields.length === 0) {
        return response.status(400).json({ message: "No fields to update." });
      }

      // Complete the SQL query
      sql += updateFields.join(", ") + " WHERE uuid = ?";
      values.push(id);

      // Execute the update query
      const [result] = await connection.query(sql, values);

      // Check if any row was updated
      if (result.affectedRows === 0) {
        return response.status(404).json({ message: "User not found." });
      }

      return response
        .status(200)
        .json({ message: `User with ID ${id} updated successfully.` });
    } finally {
      // Release the connection back to the database
      connection.release();
    }
  } catch (error) {
    console.error("Error updating user:", error.message);
    return response.status(500).json({
      error: error.message,
      message: "Error updating user!",
    });
  }
}

async function fetch_client_users(request, response) {
  try {
    // Get page and limit from query parameters, with default values
    const client_id = request.query.client_id;
    const page = parseInt(request.query.page, 10) || 1;
    const limit = parseInt(request.query.limit, 10) || 10;

    // Calculate the offset
    const offset = (page - 1) * limit;

    if (!client_id) {
      return response.status(400).json({
        error: "Client ID is required",
        message: "Client ID is required to fetch users!",
      });
    }

    // Query the database to fetch users with client details using JOIN
    const [users] = await db.query(
      `SELECT cu.*, c.name as client_name, c.email as client_email
       FROM users cu
       LEFT JOIN clients c ON c.uuid = ?
       WHERE cu.client_id = ?
          OR (JSON_VALID(cu.client_id) AND JSON_CONTAINS(cu.client_id, JSON_QUOTE(?)))
       LIMIT ? OFFSET ?`,
      [client_id, client_id, client_id, limit, offset]
    );

    // Query the database to get the total count of users for this client
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM users
       WHERE client_id = ?
          OR (JSON_VALID(client_id) AND JSON_CONTAINS(client_id, JSON_QUOTE(?)))`,
      [client_id, client_id]
    );

    // Send the users and pagination data as a response
    return response.status(200).json({
      data: users,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      message: "Users fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);

    // Handle errors and send an appropriate response
    return response.status(400).json({
      error: error.message,
      message: "Error fetching users!",
    });
  }
}

async function delete_user(request, response) {
  try {
    const { id } = request.params;

    // Check if ID is provided
    if (!id) {
      return response.status(400).json({ message: "User ID is required." });
    }

    // Delete from users table
    const [result] = await db.query("DELETE FROM users WHERE uuid = ?", [id]);

    // Check if any row was deleted
    if (result.affectedRows === 0) {
      return response.status(404).json({ message: "User not found." });
    }

    return response
      .status(200)
      .json({ message: `User with ID ${id} deleted successfully.` });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    return response.status(500).json({
      error: error.message,
      message: "Error deleting user!",
    });
  }
}

async function upload_users(request, response) {
  try {
    const { client_id } = request.body;

    if (!client_id) {
      return response.status(400).json({
        success: false,
        message: "Client ID is required.",
      });
    }

    const fileBuffer = request.file?.buffer;
    if (!fileBuffer) {
      return response.status(400).json({
        success: false,
        message: "No file provided.",
      });
    }

    // Check if client exists
    const [clientResult] = await db.query(
      "SELECT * FROM clients WHERE uuid = ?",
      [client_id]
    );

    if (clientResult.length === 0) {
      return response.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    const XLSX = require("xlsx");
    const { v4: uuidv4 } = require("uuid");
    const bcrypt = require("bcrypt");

    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Try different parsing approaches to handle various Excel formats
    let jsonData = [];
    try {
      // First try standard JSON conversion (for structured data with headers)
      jsonData = XLSX.utils.sheet_to_json(worksheet);

      // If no data or only one row, try parsing as simple array (for single column without header)
      if (jsonData.length <= 1) {
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Convert the array format to objects with email property
        jsonData = rawData
          .map((row) => {
            // Get the first cell value as email (assuming single column)
            const email = row[0];
            return { email };
          })
          .filter((item) => item.email); // Remove any empty rows
      }
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      return response.status(400).json({
        success: false,
        message: "Error parsing Excel file. Please check the format.",
        error: error.message,
      });
    }

    console.log("Parsed Excel data:", jsonData);

    if (jsonData.length === 0) {
      return response.status(400).json({
        success: false,
        message: "Excel file has no data.",
      });
    }

    // Get the connection to use transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const clientUsersSchema = await getClientUsersSchema(connection);
      // Prepare for results tracking
      const results = {
        successful: [],
        skipped: [],
        failed: [],
      };

      // Default password (hashed)
      const DEFAULT_PASSWORD = "112233";
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

      // Process each row (expected to have an email column/property)
      for (const row of jsonData) {
        // Extract email address - check for various possible column names or formats
        let email;

        if (typeof row === "string") {
          // If the row itself is just a string
          email = row;
        } else if (row.email || row.Email || row.EMAIL) {
          // If it's an object with an email property
          email = row.email || row.Email || row.EMAIL;
        } else if (Object.values(row).length > 0) {
          // Get the first value if it's an object without email property
          email = Object.values(row)[0];
        }

        // Clean the email if it's a string
        if (email && typeof email === "string") {
          email = email.trim();
        }

        if (!email || typeof email !== "string" || !email.includes("@")) {
          results.failed.push({
            email: String(email || "Empty"),
            reason: "Invalid email format",
          });
          continue;
        }

        // Extract first name from email (everything before @)
        const firstName = email.split("@")[0];

        // Check if the user already exists globally.
        const [existingUsers] = await connection.query(
          `SELECT * FROM users WHERE email = ? LIMIT 1`,
          [email]
        );

        if (existingUsers.length > 0) {
          const existingUser = existingUsers[0];

          // Do not auto-link system/reporting users to client assignments.
          if (existingUser.system_role !== "client_user") {
            results.skipped.push({
              email,
              reason: "Email belongs to a non-client user and cannot be reassigned.",
            });
            continue;
          }

          const existingClientIds = parseClientIds(existingUser.client_id);
          if (existingClientIds.includes(client_id)) {
            results.skipped.push({
              email,
              reason: "Email already registered for this client",
            });
            continue;
          }

          const mergedClientIds = [...new Set([...existingClientIds, client_id])];
          await connection.query(
            "UPDATE users SET client_id = ?, system_role = ?, type = ? WHERE id = ?",
            [serializeClientIds(mergedClientIds), "client_user", "external", existingUser.id]
          );

          await connection.query(
            (() => {
              const columns = [clientUsersSchema.userColumn, "client_id"];
              if (clientUsersSchema.hasEmailColumn) columns.push("email");
              if (clientUsersSchema.hasRoleColumn) columns.push("role");
              return `INSERT INTO client_users (${columns.join(", ")}) VALUES (${columns
                .map(() => "?")
                .join(", ")})`;
            })(),
            (() => {
              const values = [existingUser.uuid, client_id];
              if (clientUsersSchema.hasEmailColumn) values.push(existingUser.email);
              if (clientUsersSchema.hasRoleColumn) values.push(existingUser.role || "user");
              return values;
            })()
          );

          results.successful.push({
            email,
            uuid: existingUser.uuid,
            action: "linked_to_existing_user",
          });
          continue;
        }

        // Create a new client user
        try {
          const uuid = uuidv4();

          // Insert into the users table with appropriate client relationship
          const [insertResult] = await connection.query(
            `INSERT INTO users 
            (uuid, first_name, last_name, email, phone, role, system_role, type, client_id, name, password) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuid,
              firstName,
              "", // empty last name
              email,
              null, // null phone
              "user", // default role
              "client_user", // set system_role to client_user
              "external", // set type to external for client users
              serializeClientIds([client_id]),
              firstName, // name same as first_name
              hashedPassword, // use the hashed default password
            ]
          );

          if (insertResult.affectedRows > 0) {
            results.successful.push({ email, uuid });
          } else {
            results.failed.push({ email, reason: "Database insert failed" });
          }
        } catch (error) {
          console.error(`Error inserting user ${email}:`, error);
          results.failed.push({ email, reason: error.message });
        }
      }

      // Commit the transaction
      await connection.commit();

      // Ensure results arrays are defined
      const formattedResults = {
        total: jsonData.length,
        successful: Array.isArray(results.successful) ? results.successful : [],
        skipped: Array.isArray(results.skipped) ? results.skipped : [],
        failed: Array.isArray(results.failed) ? results.failed : [],
      };

      console.log("Final results to send:", formattedResults);

      return response.status(200).json({
        success: true,
        message: "Users processed successfully.",
        results: formattedResults,
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await connection.rollback();
      console.error("Database error:", error);
      return response.status(500).json({
        success: false,
        message: "Database error occurred while processing users.",
        error: error.message,
        results: {
          total: 0,
          successful: [],
          skipped: [],
          failed: [],
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error processing the file:", error);
    return response.status(500).json({
      success: false,
      message: "An error occurred while processing the file.",
      error: error.message,
      results: {
        total: 0,
        successful: [],
        skipped: [],
        failed: [],
      },
    });
  }
}

async function assign_existing_users(request, response) {
  try {
    const { client_id, user_ids } = request.body;

    if (!client_id) {
      return response.status(400).json({
        success: false,
        message: "Client ID is required.",
      });
    }

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return response.status(400).json({
        success: false,
        message: "Please provide at least one user to assign.",
      });
    }

    const [clientResult] = await db.query("SELECT uuid FROM clients WHERE uuid = ?", [
      client_id,
    ]);
    if (clientResult.length === 0) {
      return response.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const clientUsersSchema = await getClientUsersSchema(connection);
      const results = {
        successful: [],
        skipped: [],
        failed: [],
      };

      const uniqueUserIds = [...new Set(user_ids.map((id) => String(id).trim()).filter(Boolean))];

      for (const userUuid of uniqueUserIds) {
        try {
          const [users] = await connection.query(
            "SELECT id, uuid, email, role, system_role, type, client_id FROM users WHERE uuid = ? LIMIT 1",
            [userUuid]
          );

          if (users.length === 0) {
            results.failed.push({
              user_id: userUuid,
              reason: "User not found.",
            });
            continue;
          }

          const user = users[0];

          if (user.system_role !== "client_user") {
            results.skipped.push({
              user_id: user.uuid,
              email: user.email,
              reason: "Only client users can be assigned to clients.",
            });
            continue;
          }

          const existingClientIds = parseClientIds(user.client_id);
          if (existingClientIds.includes(client_id)) {
            results.skipped.push({
              user_id: user.uuid,
              email: user.email,
              reason: "User is already assigned to this client.",
            });
            continue;
          }

          const mergedClientIds = [...new Set([...existingClientIds, client_id])];

          await connection.query(
            "UPDATE users SET client_id = ?, system_role = ?, type = ? WHERE id = ?",
            [serializeClientIds(mergedClientIds), "client_user", user.type || "external", user.id]
          );

          const [existingRelation] = await connection.query(
            `SELECT id FROM client_users WHERE ${clientUsersSchema.userColumn} = ? AND client_id = ? LIMIT 1`,
            [user.uuid, client_id]
          );
          if (existingRelation.length === 0) {
            await connection.query(
              (() => {
                const columns = [clientUsersSchema.userColumn, "client_id"];
                if (clientUsersSchema.hasEmailColumn) columns.push("email");
                if (clientUsersSchema.hasRoleColumn) columns.push("role");
                return `INSERT INTO client_users (${columns.join(", ")}) VALUES (${columns
                  .map(() => "?")
                  .join(", ")})`;
              })(),
              (() => {
                const values = [user.uuid, client_id];
                if (clientUsersSchema.hasEmailColumn) values.push(user.email);
                if (clientUsersSchema.hasRoleColumn) values.push(user.role || "user");
                return values;
              })()
            );
          }

          results.successful.push({
            user_id: user.uuid,
            email: user.email,
          });
        } catch (error) {
          results.failed.push({
            user_id: userUuid,
            reason: error.message,
          });
        }
      }

      await connection.commit();

      return response.status(200).json({
        success: true,
        message: "Existing users assignment completed.",
        results: {
          total: uniqueUserIds.length,
          successful: results.successful,
          skipped: results.skipped,
          failed: results.failed,
        },
      });
    } catch (error) {
      await connection.rollback();
      return response.status(500).json({
        success: false,
        message: "Error assigning existing users.",
        error: error.message,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: "Unexpected error while assigning users.",
      error: error.message,
    });
  }
}

/**
 * Send credentials emails to selected users
 * Uses a predetermined password, stores it hashed in DB, and sends the plain text in email
 */
async function sendCredentials(request, response) {
  try {
    const { userIds } = request.body;
    const bcrypt = require("bcrypt");

    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return response.status(400).json({
        message: "Please provide a valid array of user IDs",
      });
    }

    // Get a connection from the database
    const connection = await db.getConnection();

    try {
      // Fetch user details for the given IDs
      const [users] = await connection.query(
        `SELECT uuid, email, first_name, last_name, name 
         FROM users 
         WHERE uuid IN (?)`,
        [userIds]
      );

      if (users.length === 0) {
        return response.status(404).json({
          message: "No valid users found with the provided IDs",
        });
      }

      // Use a predetermined password for all users
      const plainPassword = "Iris@123"; // Plain text password to send in email
      const hashedPassword = await bcrypt.hash(plainPassword, 10); // Hashed password to store in DB

      // For each user, update password and send email
      const results = { successful: [], failed: [] };

      for (const user of users) {
        try {
          // Update the user's password in the database with the hashed password
          await connection.query(
            "UPDATE users SET password = ? WHERE uuid = ?",
            [hashedPassword, user.uuid]
          );

          // Format user's name
          const userName =
            user.name ||
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            user.email;

          // Send the email with the plain text password
          await sendUserCredentialsEmail(user.email, userName, plainPassword);

          // Add to successful results
          results.successful.push({
            uuid: user.uuid,
            email: user.email,
            name: userName,
          });
        } catch (error) {
          console.error(`Error processing user ${user.uuid}:`, error);

          // Add to failed results
          results.failed.push({
            uuid: user.uuid,
            email: user.email,
            reason: error.message || "Unknown error",
          });
        }
      }

      return response.status(200).json({
        message: `Credentials sent to ${results.successful.length} users`,
        results: {
          total: users.length,
          successful: results.successful.length,
          failed: results.failed.length,
          details: results,
        },
      });
    } finally {
      // Release the connection back to the database
      connection.release();
    }
  } catch (error) {
    console.error("Error sending credentials:", error);
    return response.status(500).json({
      error: error.message,
      message: "Error sending credentials to users",
    });
  }
}

module.exports = {
  fetch,
  fetch_client_users,
  get_user,
  update_user,
  delete_user,
  upload_users,
  assign_existing_users,
  sendCredentials,
};
