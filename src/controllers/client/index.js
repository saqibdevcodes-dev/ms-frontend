const db = require("../../database/sql");
const { v4: uuidv4 } = require("uuid");

async function fetch(request, response) {
  try {
    // Log request information for debugging
    console.log(
      "Client fetch request from:",
      request.headers.origin || "unknown origin"
    );
    console.log("User auth:", request.user?.id || "unauthenticated");
    console.log("Query params:", request.query);

    // Check if pagination parameters are provided
    const hasPagination = request.query.page || request.query.limit;

    // Ensure consistent results regardless of environment
    // Query the database to fetch ALL clients first
    const [allClients] = await db.query(
      "SELECT * FROM clients ORDER BY created_at DESC"
    );

    console.log(`Total clients in database: ${allClients.length}`);

    if (hasPagination) {
      // Get pagination parameters from query string (default: page=1, limit=20)
      const page = parseInt(request.query.page) || 1;
      const limit = parseInt(request.query.limit) || 20;
      const offset = (page - 1) * limit;

      // Paginate the already fetched clients
      const paginatedClients = allClients.slice(offset, offset + limit);

      console.log(
        `Returning ${paginatedClients.length} clients (paginated), page ${page}, limit ${limit}`
      );

      // Send the clients and pagination data as a response
      return response.status(200).json({
        data: paginatedClients,
        pagination: {
          total: allClients.length,
          currentPage: page,
          totalPages: Math.ceil(allClients.length / limit),
          limit,
        },
        message: "All clients fetched!",
      });
    } else {
      // If no pagination parameters, return all clients
      console.log(`Returning all ${allClients.length} clients (no pagination)`);

      // Send all clients as response without pagination metadata
      return response.status(200).json({
        data: allClients,
        message: "All clients fetched!",
      });
    }
  } catch (error) {
    console.error("Error fetching clients:", error.message);

    // Handle errors and send an appropriate response
    return response.status(400).json({
      error: error.message,
      message: "Error fetching clients!",
    });
  }
}

async function create(request, response) {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      domain_name,
      branch_label,
      visit_date_label,
      branch_report_label,
      total_branches_label,
      completed_branches_label,
      my_reports_label,
      na_score_value,
    } = request.body;
    const uuid = uuidv4();

    // Check if 'name' is provided
    if (!first_name) {
      return response.status(400).json({ message: "First Name is required." });
    }

    const name = `${first_name} ${last_name}`;

    // Set default values for custom labels if not provided
    const labels = {
      branch_label: branch_label || "Branch",
      visit_date_label: visit_date_label || "Date of Visit",
      branch_report_label: branch_report_label || "Branch Report",
      total_branches_label: total_branches_label || "Total Branches",
      completed_branches_label:
        completed_branches_label || "Completed Branches",
      my_reports_label: my_reports_label || "My Branch Reports",
      na_score_value:
        na_score_value !== undefined && na_score_value !== null
          ? String(na_score_value).trim() || "0"
          : "0",
    };

    // Insert the new client into the database
    const [result] = await db.query(
      "INSERT INTO clients (uuid, first_name, last_name, name, email, phone, domain_name, branch_label, visit_date_label, branch_report_label, total_branches_label, completed_branches_label, my_reports_label, na_score_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        uuid,
        first_name,
        last_name,
        name,
        email,
        phone,
        domain_name,
        labels.branch_label,
        labels.visit_date_label,
        labels.branch_report_label,
        labels.total_branches_label,
        labels.completed_branches_label,
        labels.my_reports_label,
        labels.na_score_value,
      ]
    );

    // If insertion is successful, return the result
    return response.status(200).json({
      message: "Client created successfully!",
      client: {
        id: result.insertId,
        uuid,
        first_name,
        last_name,
        name,
        email,
        phone,
        domain_name,
        ...labels,
      },
    });
  } catch (err) {
    console.error("Error creating client:", err.message);
    return response.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
}

async function update(request, response) {
  try {
    const {
      client_id,
      first_name,
      last_name,
      domain_name,
      branch_label,
      visit_date_label,
      branch_report_label,
      total_branches_label,
      completed_branches_label,
      my_reports_label,
      na_score_value,
    } = request.body;

    // Get the current client data to check if name has changed
    const [currentClientData] = await db.query(
      "SELECT name FROM clients WHERE uuid = ?",
      [client_id]
    );

    if (currentClientData.length === 0) {
      return response.status(404).json({
        message: "Client not found.",
      });
    }

    const oldName = currentClientData[0].name;

    // Concatenate the full name for the updated client
    const newName = `${first_name} ${last_name}`;

    // Create table name format for old and new names
    const oldTableFormat = oldName
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();

    const newTableFormat = newName
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();

    // Check if name has changed and requires table rename
    const nameChanged = oldName !== newName;

    // Begin a transaction for atomicity
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Set default values for custom labels if not provided (preserve existing values if not updated)
      const labels = {
        branch_label: branch_label || "Branch",
        visit_date_label: visit_date_label || "Date of Visit",
        branch_report_label: branch_report_label || "Branch Report",
        total_branches_label: total_branches_label || "Total Branches",
        completed_branches_label:
          completed_branches_label || "Completed Branches",
        my_reports_label: my_reports_label || "My Branch Reports",
        na_score_value:
          na_score_value !== undefined && na_score_value !== null
            ? String(na_score_value).trim() || "0"
            : "0",
      };

      // Update the client details in the database
      const [result] = await connection.query(
        "UPDATE clients SET first_name = ?, last_name = ?, name = ?, domain_name = ?, branch_label = ?, visit_date_label = ?, branch_report_label = ?, total_branches_label = ?, completed_branches_label = ?, my_reports_label = ?, na_score_value = ? WHERE uuid = ?",
        [
          first_name,
          last_name,
          newName,
          domain_name,
          labels.branch_label,
          labels.visit_date_label,
          labels.branch_report_label,
          labels.total_branches_label,
          labels.completed_branches_label,
          labels.my_reports_label,
          labels.na_score_value,
          client_id,
        ]
      );

      // If name changed, update the table names
      if (nameChanged) {
        console.log(`Client name changed from "${oldName}" to "${newName}"`);
        console.log(
          `Old table prefix: ${oldTableFormat}, New table prefix: ${newTableFormat}`
        );

        // Check if related tables exist
        const tablesToCheck = [
          `${oldTableFormat}_branches`,
          `${oldTableFormat}_reports`,
        ];

        for (const oldTable of tablesToCheck) {
          const [tableExists] = await connection.query(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
            [oldTable]
          );

          if (tableExists[0].count > 0) {
            const newTable = oldTable.replace(oldTableFormat, newTableFormat);
            console.log(`Renaming table ${oldTable} to ${newTable}`);

            // Rename the table
            await connection.query(`RENAME TABLE ${oldTable} TO ${newTable}`);

            console.log(`Successfully renamed table to ${newTable}`);
          } else {
            console.log(`Table ${oldTable} does not exist, no need to rename`);
          }
        }
      }

      // Commit the transaction
      await connection.commit();

      // Return success response
      return response.status(200).json({
        message: "Client updated successfully!",
        client: {
          id: client_id,
          first_name,
          last_name,
          name: newName,
          domain_name,
          ...labels,
        },
        tables_updated: nameChanged,
      });
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error updating client:", err.message);
    return response.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
}

async function view(request, response) {
  try {
    const { client_id } = request.query;

    // Get the client details from the database
    const [results] = await db.query("SELECT * from clients WHERE uuid = ?", [
      client_id,
    ]);

    // Check if any results were returned
    if (results.length === 0) {
      return response.status(404).json({
        message: "Client not found.",
      });
    }

    // Return success response
    return response.status(200).json({
      message: "Client found successfully!",
      data: results[0],
    });
  } catch (err) {
    console.error("Error fetching client:", err.message);
    return response.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
}

async function delete_client(request, response) {
  try {
    const { client_id } = request.query;

    if (!client_id) {
      return response.status(400).json({
        message: "Client id is required.",
      });
    }

    // Get a connection and start a transaction to ensure atomicity
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // First get client details to identify client-specific tables
      const [clientDetails] = await connection.query(
        "SELECT * FROM clients WHERE uuid = ?",
        [client_id]
      );

      if (clientDetails.length === 0) {
        return response.status(404).json({
          message: "Client not found.",
        });
      }

      const clientInfo = clientDetails[0];

      // Format client name for table names
      const formattedClientName = clientInfo.name
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();

      console.log(`Deleting client: ${clientInfo.name} (${client_id})`);

      // 1. Delete client users
      console.log("Deleting associated users...");
      const [deletedUsers] = await connection.query(
        "DELETE FROM users WHERE client_id = ?",
        [client_id]
      );
      console.log(`Deleted ${deletedUsers.affectedRows} users`);

      // 2. Delete client ranges
      console.log("Deleting ranges...");
      const [deletedRanges] = await connection.query(
        "DELETE FROM ranges WHERE client_id = ?",
        [client_id]
      );
      console.log(`Deleted ${deletedRanges.affectedRows} ranges`);

      // 3. Delete client report templates
      console.log("Deleting report templates...");
      const [deletedTemplates] = await connection.query(
        "DELETE FROM report_templates WHERE client_id = ?",
        [client_id]
      );
      console.log(`Deleted ${deletedTemplates.affectedRows} report templates`);

      // 4. Check for and drop client-specific tables
      const clientSpecificTables = [
        `${formattedClientName}_branches`,
        `${formattedClientName}_reports`,
        `${formattedClientName}_responses`,
      ];

      for (const tableName of clientSpecificTables) {
        // Check if table exists
        const [tableExists] = await connection.query(
          "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
          [tableName]
        );

        if (tableExists[0].count > 0) {
          console.log(`Dropping table: ${tableName}`);
          await connection.query(`DROP TABLE ${tableName}`);
          console.log(`Successfully dropped table: ${tableName}`);
        } else {
          console.log(`Table ${tableName} does not exist, skipping`);
        }
      }

      // 5. Finally delete the client record
      console.log("Deleting client record...");
      const [result] = await connection.query(
        "DELETE FROM clients WHERE uuid = ?",
        [client_id]
      );

      // Commit the transaction after all operations successful
      await connection.commit();

      // Return success response with details of what was deleted
      return response.status(200).json({
        message: "Client and all associated data deleted successfully!",
        details: {
          deleted_users: deletedUsers.affectedRows,
          deleted_ranges: deletedRanges.affectedRows,
          deleted_templates: deletedTemplates.affectedRows,
          dropped_tables: clientSpecificTables,
        },
      });
    } catch (err) {
      // Rollback in case of error
      await connection.rollback();
      throw err;
    } finally {
      // Always release the connection
      connection.release();
    }
  } catch (err) {
    console.error("Error deleting client:", err.message);
    return response.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
}

const clientController = {
  fetch,
  create,
  update,
  view,
  delete_client,
};

module.exports = clientController;
