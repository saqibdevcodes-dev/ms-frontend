const db = require("../database/sql");

/**
 * Log a system activity
 *
 * @param {number} userId - The ID of the user performing the action
 * @param {string} activityType - The type of activity (e.g., 'Login', 'Reset Password', etc.)
 * @param {string} details - Additional details about the activity
 * @param {string} ipAddress - The IP address of the client
 * @returns {Promise<void>}
 */
async function logActivity(
  userId,
  activityType,
  details = null,
  ipAddress = null
) {
  try {
    // Check if activities table exists
    const [tables] = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'activities'"
    );

    // Only attempt to insert if the table exists
    if (tables.length > 0) {
      await db.query(
        "INSERT INTO activities (user_id, activity_type, details, ip_address) VALUES (?, ?, ?, ?)",
        [userId, activityType, details, ipAddress]
      );
      console.log(`Activity logged: ${activityType} by user ${userId}`);
    } else {
      console.log("Activities table does not exist, skipping activity logging");
    }
  } catch (error) {
    // Just log the error, don't throw - we don't want primary actions to fail if logging fails
    console.error("Error logging activity:", error);
  }
}

module.exports = {
  logActivity,
};
