/**
 * Migration script to remove the branch_code column from all client report tables
 * after ensuring data is preserved in the primary_field_value column
 */

const db = require("../sql");

async function migrateTables() {
  console.log("Starting migration to remove branch_code columns...");
  const connection = await db.getConnection();

  try {
    // Get all tables in the database
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name LIKE '%_reports'
    `);

    console.log(`Found ${tables.length} report tables to process`);
    console.log("Tables found:", JSON.stringify(tables, null, 2));

    // Process each table
    for (const tableObj of tables) {
      // Get the actual table name from the query result
      const tableName = tableObj.TABLE_NAME || tableObj.table_name;

      if (!tableName) {
        console.log("Could not determine table name from:", tableObj);
        continue;
      }

      console.log(`Processing table: ${tableName}`);

      // Check if branch_code column exists
      const [hasBranchCode] = await connection.query(
        `
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = ? 
        AND column_name = 'branch_code'
      `,
        [tableName]
      );

      if (hasBranchCode[0].count === 0) {
        console.log(
          `Table ${tableName} does not have branch_code column, skipping`
        );
        continue;
      }

      // Check if primary_field_value column exists (it should, but just to be safe)
      const [hasPrimaryFieldValue] = await connection.query(
        `
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = ? 
        AND column_name = 'primary_field_value'
      `,
        [tableName]
      );

      if (hasPrimaryFieldValue[0].count === 0) {
        console.log(
          `Table ${tableName} does not have primary_field_value column, adding it first`
        );

        // Add primary_field_value if it doesn't exist
        await connection.query(`
          ALTER TABLE ${tableName}
          ADD COLUMN primary_field_value VARCHAR(255)
        `);

        // Add primary_field_name if it doesn't exist
        const [hasPrimaryFieldName] = await connection.query(
          `
          SELECT COUNT(*) as count 
          FROM information_schema.columns 
          WHERE table_schema = DATABASE() 
          AND table_name = ? 
          AND column_name = 'primary_field_name'
        `,
          [tableName]
        );

        if (hasPrimaryFieldName[0].count === 0) {
          await connection.query(`
            ALTER TABLE ${tableName}
            ADD COLUMN primary_field_name VARCHAR(100) NOT NULL DEFAULT 'branch_code'
          `);
        }
      }

      // Migrate data from branch_code to primary_field_value if not already done
      console.log(
        `Migrating data from branch_code to primary_field_value in ${tableName}`
      );
      await connection.query(`
        UPDATE ${tableName}
        SET primary_field_value = branch_code
        WHERE primary_field_value IS NULL AND branch_code IS NOT NULL
      `);

      // Remove branch_code column
      console.log(`Removing branch_code column from ${tableName}`);
      await connection.query(`
        ALTER TABLE ${tableName}
        DROP COLUMN branch_code
      `);

      console.log(`Successfully processed ${tableName}`);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateTables()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = {
  migrateTables,
};
