// db.js
const mysql = require("mysql2/promise");

// Create a single shared pool
const pool = mysql.createPool({
  host: "147.79.100.197",
  port: 3306,
  database: "saqib_ms",
  user: "saqib_admin",
  password: "irisSaqib @1998",
  connectionLimit: 100, // max concurrent connections in the pool
  acquireTimeout: 60000,
  waitForConnections: true,
  queueLimit: 0,
  multipleStatements: false,
});

// Apply session optimizations for every new connection
async function optimizeConnectionForSorting(connection) {
  try {
    await connection.query("SET SESSION sort_buffer_size = 16*1024*1024"); // 16MB
    await connection.query("SET SESSION tmp_table_size = 64*1024*1024"); // 64MB
    await connection.query("SET SESSION max_heap_table_size = 64*1024*1024"); // 64MB
    await connection.query("SET SESSION join_buffer_size = 8*1024*1024"); // 8MB
  } catch (error) {
    console.error("Error setting MySQL session variables:", error);
  }
}

// Attach optimizations and logging when pool creates a new connection
pool.on("connection", async (connection) => {
  await optimizeConnectionForSorting(connection);
});

pool.on("acquire", (connection) => {});

pool.on("release", (connection) => {});

pool.on("error", (err) => {
  console.error("Database pool error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
  }
  if (err.code === "ER_CON_COUNT_ERROR") {
  }
  if (err.code === "ECONNREFUSED") {
  }
});

// Helper for safer queries (auto-release)
pool.safeQuery = async function (query, params = []) {
  const connection = await this.getConnection();
  try {
    const result = await connection.query(query, params);
    return result;
  } finally {
    connection.release();
  }
};

// Optional: log pool stats every 30s for debugging
// setInterval(() => {
//
//     allConnections: pool._allConnections.length,
//     freeConnections: pool._freeConnections.length,
//     acquiringConnections: pool._acquiringConnections.length,
//   });
// }, 30000);

module.exports = pool;
