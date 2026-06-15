const db = require("../database/sql");

/**
 * Record a login attempt in the login_history table
 *
 * @param {number} userId - The ID of the user attempting to login
 * @param {string} ipAddress - The IP address of the client
 * @param {string} macAddress - The MAC address of the client device
 * @param {string} status - The status of the login attempt ('Success' or 'Failed')
 * @returns {Promise<void>}
 */
async function recordLoginAttempt(
  userId,
  ipAddress,
  macAddress = null,
  status = "Success"
) {
  try {
    // Check if login_history table exists
    const [tables] = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'login_history'"
    );

    // Only attempt to insert if the table exists
    if (tables.length > 0) {
      await db.query(
        "INSERT INTO login_history (user_id, ip_address, mac_address, status) VALUES (?, ?, ?, ?)",
        [userId, ipAddress, macAddress, status]
      );
    }
  } catch (error) {
    // Just log the error, don't throw - we don't want login to fail if logging fails
    console.error("Error recording login attempt:", error);
  }
}

module.exports = {
  recordLoginAttempt,
};
