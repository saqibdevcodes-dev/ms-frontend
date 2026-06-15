const { Router } = require("express");
const {
  saveTemplate,
  getTemplates,
  getTemplateById,
  deleteTemplate,
} = require("../../controllers/templates");

const router = Router();

// Save a new template or update existing one
router.post("/", saveTemplate);

// Get all templates for a client
router.get("/client/:client_id", getTemplates);

// Get a specific template by ID
router.get("/:id", getTemplateById);

// Delete a template
router.delete("/:id", deleteTemplate);

module.exports = router;
