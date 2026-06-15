const db = require("../../database/sql");

/**
 * Save a report template
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const saveTemplate = async (req, res) => {
  try {
    const { client_id, template_name, branch_code, colors, content } = req.body;
    const user_id = req.user?.id || null;

    if (!client_id || !template_name) {
      return res.status(400).json({
        error: "Client ID and template name are required",
      });
    }

    // Check if template already exists for this client with the same name
    const connection = await db.getConnection();

    try {
      const [existing] = await connection.query(
        "SELECT id FROM report_templates WHERE client_id = ? AND template_name = ?",
        [client_id, template_name]
      );

      if (existing.length > 0) {
        // Update existing template
        await connection.query(
          `UPDATE report_templates 
           SET branch_code = ?, colors = ?, content = ?, updated_by = ?, updated_at = NOW() 
           WHERE client_id = ? AND template_name = ?`,
          [
            branch_code || null,
            JSON.stringify(colors || {}),
            JSON.stringify(content || {}),
            user_id,
            client_id,
            template_name,
          ]
        );

        return res.status(200).json({
          success: true,
          message: "Template updated successfully",
        });
      } else {
        // Create new template
        await connection.query(
          `INSERT INTO report_templates 
           (client_id, template_name, branch_code, colors, content, created_by, updated_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            client_id,
            template_name,
            branch_code || null,
            JSON.stringify(colors || {}),
            JSON.stringify(content || {}),
            user_id,
            user_id,
          ]
        );

        return res.status(201).json({
          success: true,
          message: "Template saved successfully",
        });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error saving template:", error);
    return res.status(500).json({
      error: "Failed to save template",
      details: error.message,
    });
  }
};

/**
 * Fetch templates for a client
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getTemplates = async (req, res) => {
  try {
    const { client_id } = req.params;
    // Get pagination parameters from query string (default: page=1, limit=20)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (!client_id) {
      return res.status(400).json({
        error: "Client ID is required",
      });
    }

    const connection = await db.getConnection();

    try {
      // Set session variables to increase sort buffer for this connection
      // await db.optimizeConnectionForSorting(connection);

      // First get the total count for pagination metadata
      const [countResult] = await connection.query(
        "SELECT COUNT(*) as total FROM report_templates WHERE client_id = ?",
        [client_id]
      );
      const totalTemplates = countResult[0].total;
      const totalPages = Math.ceil(totalTemplates / limit);

      // Use a more efficient query with pagination
      const [templates] = await connection.query(
        "SELECT id, client_id, template_name, branch_code, created_at, updated_at, created_by, updated_by FROM report_templates WHERE client_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        [client_id, limit, offset]
      );

      // If templates found, fetch the full data for these templates
      const formattedTemplates = [];
      if (templates.length > 0) {
        for (const template of templates) {
          // Fetch colors and content separately to reduce memory usage during sorting
          const [contentData] = await connection.query(
            "SELECT colors, content FROM report_templates WHERE id = ?",
            [template.id]
          );

          if (contentData.length > 0) {
            try {
              // Handle colors field
              let parsedColors = {};
              if (contentData[0].colors) {
                if (typeof contentData[0].colors === "object") {
                  parsedColors = contentData[0].colors;
                } else {
                  parsedColors = JSON.parse(contentData[0].colors);
                }
              }

              // Handle content field
              let parsedContent = {};
              if (contentData[0].content) {
                if (typeof contentData[0].content === "object") {
                  parsedContent = contentData[0].content;
                } else {
                  parsedContent = JSON.parse(contentData[0].content);
                }
              }

              formattedTemplates.push({
                ...template,
                colors: parsedColors,
                content: parsedContent,
              });
            } catch (parseError) {
              console.error(
                `Error parsing JSON for template ${template.id}:`,
                parseError
              );
              formattedTemplates.push({
                ...template,
                colors: {},
                content: {},
              });
            }
          } else {
            formattedTemplates.push({
              ...template,
              colors: {},
              content: {},
            });
          }
        }
      }

      return res.status(200).json({
        success: true,
        data: formattedTemplates,
        pagination: {
          total: totalTemplates,
          page,
          limit,
          totalPages,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching templates:", error);
    return res.status(500).json({
      error: "Failed to fetch templates",
      details: error.message,
    });
  }
};

/**
 * Fetch a specific template by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Template ID is required",
      });
    }

    const connection = await db.getConnection();

    try {
      const [templates] = await connection.query(
        "SELECT * FROM report_templates WHERE id = ?",
        [id]
      );

      if (templates.length === 0) {
        return res.status(404).json({
          error: "Template not found",
        });
      }

      // Parse JSON fields
      try {
        // Handle colors field
        let parsedColors = {};
        if (templates[0].colors) {
          if (typeof templates[0].colors === "object") {
            parsedColors = templates[0].colors;
          } else {
            parsedColors = JSON.parse(templates[0].colors);
          }
        }

        // Handle content field
        let parsedContent = {};
        if (templates[0].content) {
          if (typeof templates[0].content === "object") {
            parsedContent = templates[0].content;
          } else {
            parsedContent = JSON.parse(templates[0].content);
          }
        }

        const template = {
          ...templates[0],
          colors: parsedColors,
          content: parsedContent,
        };

        return res.status(200).json({
          success: true,
          data: template,
        });
      } catch (parseError) {
        console.error(
          `Error parsing JSON for template ${templates[0].id}:`,
          parseError
        );
        const template = {
          ...templates[0],
          colors: {},
          content: {},
        };

        return res.status(200).json({
          success: true,
          data: template,
        });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching template:", error);
    return res.status(500).json({
      error: "Failed to fetch template",
      details: error.message,
    });
  }
};

/**
 * Delete a template by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Template ID is required",
      });
    }

    const connection = await db.getConnection();

    try {
      const [result] = await connection.query(
        "DELETE FROM report_templates WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "Template not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Template deleted successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error deleting template:", error);
    return res.status(500).json({
      error: "Failed to delete template",
      details: error.message,
    });
  }
};

module.exports = {
  saveTemplate,
  getTemplates,
  getTemplateById,
  deleteTemplate,
};
