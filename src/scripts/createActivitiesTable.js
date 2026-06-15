const db = require("../database/sql");
const fs = require("fs");
const path = require("path");

async function createActivitiesTable() {
  try {
    console.log("Starting activities table creation script...");

    // Read the SQL file content
    const sqlFilePath = path.join(__dirname, "../../sql/activities.sql");
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    // Split SQL commands by semicolon
    const commands = sqlContent.split(";").filter((cmd) => cmd.trim() !== "");

    // Execute each command
    for (const command of commands) {
      try {
        console.log(
          "Executing SQL command:",
          command.substring(0, 100) + "..."
        );
        await db.query(command);
        console.log("Command executed successfully");
      } catch (cmdError) {
        console.error("Error executing command:", cmdError);
        // Continue with next command even if one fails
      }
    }

    console.log("Activities table creation completed");

    // Check if table was created successfully
    const [tables] = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'activities'"
    );

    if (tables.length > 0) {
      console.log("Activities table confirmed to exist in the database");

      // Count records to verify data insertion
      const [count] = await db.query(
        "SELECT COUNT(*) as count FROM activities"
      );
      console.log(`Number of activity records: ${count[0].count}`);
    } else {
      console.error("Failed to create activities table");
    }
  } catch (error) {
    console.error("Error in activities table creation script:", error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the function
createActivitiesTable();
