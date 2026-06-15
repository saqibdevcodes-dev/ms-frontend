/**
 * Migration routes for running database migrations via API
 */

const express = require('express');
const router = express.Router();
const pdfUrlMigration = require('../../database/migrations/add_pdf_url_column_migration');

/**
 * Run the PDF URL column migration
 * GET /api/migrations/add-pdf-url
 */
router.get('/add-pdf-url', async (req, res) => {
  try {
    console.log('API: Running PDF URL migration...');
    const result = await pdfUrlMigration.up();
    
    return res.status(200).json({
      success: true,
      message: 'PDF URL migration completed successfully',
      data: result
    });
  } catch (error) {
    console.error('API: Migration failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error.message
    });
  }
});

/**
 * Rollback the PDF URL column migration
 * GET /api/migrations/rollback-pdf-url
 */
router.get('/rollback-pdf-url', async (req, res) => {
  try {
    console.log('API: Rolling back PDF URL migration...');
    const result = await pdfUrlMigration.down();
    
    return res.status(200).json({
      success: true,
      message: 'PDF URL migration rolled back successfully',
      data: result
    });
  } catch (error) {
    console.error('API: Rollback failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Rollback failed',
      details: error.message
    });
  }
});

module.exports = router;




