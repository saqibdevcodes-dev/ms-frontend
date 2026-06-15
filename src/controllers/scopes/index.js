const XLSX = require("xlsx");
const fs2 = require("fs/promises");

const fs = require("fs");
const path = require("path");
const db = require("../../database/sql"); // Ensure your MySQL connection db is correctly set up

async function createScopes(request, response) {
  try {
    const { client_id, scopes } = request.body;

    if (!client_id || !Array.isArray(scopes)) {
      return response.status(400).json({
        message: "client_id and scopes (array) are required.",
      });
    }

    const connection = await db.getConnection();

    try {
      // Check if any scopes exist for the provided client_id
      const [existingScopes] = await connection.query(
        "SELECT id FROM scopes WHERE client_id = ?",
        [client_id]
      );

      // If scopes exist for the client_id, delete them
      if (existingScopes.length > 0) {
        await connection.query("DELETE FROM scopes WHERE client_id = ?", [
          client_id,
        ]);
      }

      // Insert new scopes for the client_id
      const scopesData = scopes.map((item) => [
        client_id,
        item.essential,
        item.essential_key,
        item.id,
      ]);

      const [result] = await connection.query(
        "INSERT INTO scopes (client_id, scope, scope_key, essential_id) VALUES ?",
        [scopesData]
      );

      if (result.affectedRows !== scopes.length) {
        throw new Error("Failed to insert all scopes.");
      }

      // Get User Roles
      const [userRoles] = await connection.query("SELECT * FROM user_roles");
      const rolesHeaders = userRoles.map((role) => role.role);
      const scopesHeaders = scopes.map((item) => item.essential);
      const headers = [...scopesHeaders, ...rolesHeaders];

      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Scopes Template");

      const [client_rows] = await connection.query(
        "SELECT first_name, last_name FROM clients WHERE uuid = ?",
        [client_id]
      );
      const client_name = `${client_rows[0].first_name}_${client_rows[0].last_name}`;

      // Step 3: Define the directory and file path for saving the template
      const uploadsDir = path.join(__dirname, "uploads");
      const clientDir = path.join(uploadsDir, client_name); // Store inside 'uploads' directory

      await fs2.mkdir(clientDir, { recursive: true }); // Ensure the directory exists

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[-T:]/g, "_")
        .split(".")[0]; // Format: YYYY_MM_DD_HH_MM_SS

      const fileName = `${client_name}_${timestamp}_scopes_template.xlsx`;
      const filePath = path.join(clientDir, fileName);

      // Write the workbook
      XLSX.writeFile(workbook, filePath);

      // Store a **relative path** in the database
      const relativePath = path.relative(uploadsDir, filePath);

      await connection.query(
        "INSERT INTO scope_templates (client_id, template_name, download_url) VALUES (?, ?, ?)",
        [client_id, fileName, relativePath]
      );

      return response.status(200).json({
        message: "Scopes created and template uploaded successfully.",
        download_url: relativePath, // Return relative path
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    return response.status(500).json({
      error: error.message || "An error occurred.",
    });
  }
}


async function downloadScopeTemplate(request, response) {
  try {
    const { id } = request.params;

    if (!id) {
      return response.status(400).json({ message: "Template ID is required." });
    }

    // Fetch the template details from the database
    const [template] = await db.query(
      "SELECT download_url, template_name FROM scope_templates WHERE id = ?",
      [id]
    );

    if (!template.length) {
      return response.status(404).json({ message: "Template not found." });
    }

    const fileRelativePath = template[0].download_url;
    const fileName = template[0].template_name;

    // Convert relative path to absolute path
    const filePath = path.join(__dirname, "uploads", fileRelativePath);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return response.status(404).json({
        message: "File not found.",
        filePath, // Debugging info
      });
    }

    // Send the file for download
    return response.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        return response
          .status(500)
          .json({ message: "Error downloading file." });
      }
    });
  } catch (error) {
    return response.status(500).json({
      error: error.message || "An error occurred while downloading the file.",
    });
  }
}


async function regenerateScopesTemplate(request, response) {
  try {
    const { client_id, scopes } = request.body;

    if (!client_id || !Array.isArray(scopes)) {
      return response.status(400).json({
        message: "client_id and scopes (array) are required.",
      });
    }

    const connection = await db.getConnection();

    try {
      // Get User Roles
      const [userRoles] = await connection.query("SELECT * FROM user_roles");

      const rolesHeaders = userRoles.map((role) => role.role);
      const scopesHeaders = scopes.map((item) => item.scope);

      const mediaHeaders = ["Video", "Audio", "Pictures"];
      const headers = [...scopesHeaders, ...mediaHeaders, ...rolesHeaders];

      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Scopes Template");

      //Get Client
      const [client_rows] = await connection.query(
        "SELECT first_name, last_name FROM clients WHERE uuid = ?",
        [client_id]
      );
      const client_name = `${client_rows[0].first_name}_${client_rows[0].last_name}`;

      // Step 3: Define the directory and file path for saving the template
      const clientDir = path.join(__dirname, "uploads", client_name);
      await fs2.mkdir(clientDir, { recursive: true }); // Ensure the directory exists

      const now = new Date();

      // Extract components
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");

      // Determine AM or PM
      const meridian = hours >= 12 ? "PM" : "AM";

      // Convert hours to 12-hour format
      hours = hours % 12 || 12; // Ensure hour 0 becomes 12

      const dateTimeString = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${hours
        .toString()
        .padStart(2, "0")}-${minutes}-${seconds} ${meridian}`;

      const fileName = `${client_name}_${dateTimeString}_scopes_template.xlsx`;
      const filePath = path.join(clientDir, fileName);

      // Write the workbook and ensure the operation completes successfully
      XLSX.writeFile(workbook, filePath);

      // Step 4: Generate a public URL (simulate using your storage system)
      const publicUrl = `C:/Users/Muhammad Waqas/Downloads/projects/mysterious-shopping/-mysterious-shopping-backend/src/controllers/scopes/uploads/${client_name}/${fileName}`;

      // Step 5: Save the template name and download URL in the database
      await connection.query(
        "INSERT INTO scope_templates (client_id, template_name, download_url) VALUES (?, ?, ?)",
        [client_id, fileName, publicUrl]
      );

      // Return the public download URL in the response
      return response.status(200).json({
        message: "Scopes created and template uploaded successfully.",
        download_url: publicUrl,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    return response.status(500).json({
      error: error.message || "An error occurred.",
    });
  }
}

async function fetchScopes(request, response) {
  try {
    const { client_id } = request.query;

    if (!client_id) {
      return response.status(400).json({
        message: "client_id is required.",
      });
    }

    // Get a connection from the pool
    const connection = await db.getConnection();

    try {
      // Query the scopes based on the client ID
      const [rows] = await connection.query(
        "SELECT * FROM scopes WHERE client_id = ?",
        [client_id]
      );

      return response.status(200).json({
        data: rows,
        message: "Scopes fetched successfully.",
      });
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    return response.status(500).json({
      error: error.message || "An error occurred while fetching scopes.",
    });
  }
}

async function fetchScopeTemplates(request, response) {
  try {
    const { client_id } = request.query;

    if (!client_id) {
      return response.status(400).json({
        message: "client_id is required.",
      });
    }

    // Get a connection from the pool
    const connection = await db.getConnection();

    try {
      // Query the scopes based on the client ID
      const [rows] = await connection.query(
        "SELECT * FROM scope_templates WHERE client_id = ?",
        [client_id]
      );

      return response.status(200).json({
        data: rows,
        message: "Scopes Templates fetched successfully.",
      });
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    return response.status(500).json({
      error: error.message || "An error occurred while fetching scopes.",
    });
  }
}

async function deleteScopeTemplate(request, response) {
  try {
    const { client_id, template_id } = request.query;

    // Check if client_id and template_id are provided
    if (!client_id || !template_id) {
      return response.status(400).json({
        message: "Both client_id and template_id are required.",
      });
    }

    // Get a connection from the pool
    const connection = await db.getConnection();

    try {
      // Check if the template exists for the given client_id and template_id
      const [rows] = await connection.query(
        "SELECT * FROM scope_templates WHERE client_id = ? AND id = ?",
        [client_id, template_id]
      );

      if (rows.length === 0) {
        return response.status(404).json({
          message: "Template not found for the given client_id and id.",
        });
      }

      const [client_rows] = await connection.query(
        "SELECT first_name, last_name FROM clients WHERE uuid = ?",
        [client_id]
      );
      const client_name = `${client_rows[0].first_name}_${client_rows[0].last_name}`;

      // Extract the file name from the database record (assuming it is stored)
      const templateFileName = rows[0].template_name;

      // Step 3: Define the directory and file path for deleting the template
      const clientDir = path.join(__dirname, "uploads", client_name);
      const templateFilePath = path.join(clientDir, templateFileName);

      try {
        await fs2.unlink(templateFilePath); // Remove the file
        console.log(`File deleted: ${templateFilePath}`);
      } catch (err) {
        if (err.code === "ENOENT") {
          console.warn(`File not found for deletion: ${templateFilePath}`);
        } else {
          console.error(`Error deleting file: ${templateFilePath}`, err);
        }
      }

      // Delete the scope template based on client_id and template_id
      const [deleteResult] = await connection.query(
        "DELETE FROM scope_templates WHERE client_id = ? AND id = ?",
        [client_id, template_id]
      );

      // Check if any rows were affected (i.e., template was deleted)
      if (deleteResult.affectedRows === 0) {
        return response.status(404).json({
          message: "Template not found or already deleted.",
        });
      }

      return response.status(200).json({
        message: "Scope template deleted successfully.",
      });
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    return response.status(500).json({
      error:
        error.message || "An error occurred while deleting the scope template.",
    });
  }
}

const scopeController = {
  createScopes,
  downloadScopeTemplate,
  fetchScopes,
  fetchScopeTemplates,
  deleteScopeTemplate,
  regenerateScopesTemplate,
};

module.exports = scopeController;
