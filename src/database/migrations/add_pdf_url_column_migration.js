/**
 * Migration to add pdf_url column to all client reports tables
 */

const db = require('../sql');

async function up() {
  const connection = await db.getConnection();
  
  try {
    console.log('Starting pdf_url column migration...');
    
    // Get all tables that end with _reports (client-specific tables)
    const [tables] = await connection.query(
      `SELECT TABLE_NAME 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME LIKE '%_reports'`
    );

    console.log(`Found ${tables.length} client reports tables`);

    let successCount = 0;
    let alreadyExistsCount = 0;
    let errorCount = 0;

    // Add pdf_url column to each table
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      try {
        // Check if pdf_url column already exists
        const [columns] = await connection.query(
          `SELECT COLUMN_NAME 
           FROM information_schema.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = ? 
           AND COLUMN_NAME = 'pdf_url'`,
          [tableName]
        );

        if (columns.length === 0) {
          // Column doesn't exist, add it
          await connection.query(
            `ALTER TABLE \`${tableName}\` ADD COLUMN pdf_url TEXT AFTER timestamp_url`
          );
          console.log(`✅ Added pdf_url column to ${tableName}`);
          successCount++;
        } else {
          console.log(`⏭️  pdf_url column already exists in ${tableName}`);
          alreadyExistsCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing table ${tableName}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully added: ${successCount}`);
    console.log(`   ⏭️  Already existed: ${alreadyExistsCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total tables: ${tables.length}\n`);

    return {
      success: true,
      added: successCount,
      alreadyExists: alreadyExistsCount,
      errors: errorCount,
      total: tables.length
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function down() {
  const connection = await db.getConnection();
  
  try {
    console.log('Rolling back pdf_url column migration...');
    
    // Get all tables that end with _reports
    const [tables] = await connection.query(
      `SELECT TABLE_NAME 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME LIKE '%_reports'`
    );

    console.log(`Found ${tables.length} client reports tables`);

    // Remove pdf_url column from each table
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      try {
        // Check if pdf_url column exists
        const [columns] = await connection.query(
          `SELECT COLUMN_NAME 
           FROM information_schema.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = ? 
           AND COLUMN_NAME = 'pdf_url'`,
          [tableName]
        );

        if (columns.length > 0) {
          // Column exists, remove it
          await connection.query(
            `ALTER TABLE \`${tableName}\` DROP COLUMN pdf_url`
          );
          console.log(`✅ Removed pdf_url column from ${tableName}`);
        } else {
          console.log(`⏭️  pdf_url column doesn't exist in ${tableName}`);
        }
      } catch (error) {
        console.error(`❌ Error processing table ${tableName}:`, error.message);
      }
    }

    console.log('\n✨ Rollback completed!');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { up, down };




