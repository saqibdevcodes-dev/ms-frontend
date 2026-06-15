const db = require("../database/sql");

async function setupDatabase() {
  try {
    console.log("Setting up activities table...");

    // Create activities table
    await db.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL,
        activity_type varchar(255) NOT NULL,
        details text,
        ip_address varchar(45) DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY activities_user_id_index (user_id),
        CONSTRAINT activities_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Activities table created successfully");

    // Insert sample data
    console.log("Adding sample activity data...");

    // Get a user ID (preferably an admin) to use for sample activities
    const [users] = await db.query("SELECT id FROM users ORDER BY id LIMIT 1");

    if (users.length > 0) {
      const userId = users[0].id;

      // Insert sample activities
      await db.query(
        `
        INSERT INTO activities (user_id, activity_type, details, ip_address)
        VALUES 
        (?, 'User Login', 'User logged in successfully', '192.168.1.1'),
        (?, 'Password Reset', 'Password reset requested', '192.168.1.2'),
        (?, 'Profile Updated', 'User profile information updated', '192.168.1.3'),
        (?, 'New Client Added', 'Created a new client account', '192.168.1.4'),
        (?, 'Report Submitted', 'Submitted new mystery shopping report', '192.168.1.5')
      `,
        [userId, userId, userId, userId, userId]
      );

      console.log("Sample activities added successfully");
    } else {
      console.log("No users found in the database, skipping sample data");
    }

    // Verify table creation
    const [tables] = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'activities'"
    );

    if (tables.length > 0) {
      console.log("✅ Activities table confirmed to exist in the database");

      // Count records to verify data insertion
      const [count] = await db.query(
        "SELECT COUNT(*) as count FROM activities"
      );
      console.log(`Number of activity records: ${count[0].count}`);
    } else {
      console.error("❌ Failed to create activities table");
    }
  } catch (error) {
    console.error("Error in database setup:", error);
  } finally {
    // Close the connection and exit
    process.exit(0);
  }
}

// Run the setup
setupDatabase();
