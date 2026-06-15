const db = require("../../database/sql");

/**
 * Track user performance when a report is submitted or updated
 * This function adds or updates a record in the user_performance table
 *
 * @param {Object} reportData - Report data including client_id, user_id, report_id
 * @param {number} reportData.client_id - Client ID
 * @param {number} reportData.user_id - User ID
 * @param {number} reportData.report_id - Report ID
 * @param {string} reportData.report_name - Name of the report (template_name)
 * @param {number} reportData.report_time - Time taken to complete the report in minutes
 * @param {Date|string} reportData.creation_timestamp - Creation timestamp of the report
 * @param {number} reportData.elapsed_seconds - Elapsed time in seconds (from report content)
 * @param {string} reportData.status - Status of the report (completed, pending, rejected, draft)
 * @param {number} reportData.score - Score of the report if applicable
 * @returns {Promise<boolean>} - Success status
 */
const trackUserPerformance = async (reportData) => {
  try {
    console.log("reportData", reportData);

    const {
      client_id,
      user_id,
      report_id,
      report_name,
      report_time, // Now in minutes
      creation_timestamp,
      elapsed_seconds,
      status = "completed",
      score = null,
    } = reportData;

    // Handle report creation time - prefer using the provided creation_timestamp
    let reportCreationTime = null;
    if (creation_timestamp instanceof Date) {
      reportCreationTime = creation_timestamp;
    } else if (typeof creation_timestamp === "string") {
      reportCreationTime = new Date(creation_timestamp);
    } else {
      // Default to current time if not provided
      reportCreationTime = new Date();
    }

    // Format timestamp for MySQL
    const formattedTimestamp = reportCreationTime
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    console.log(`Using report creation timestamp: ${formattedTimestamp}`);

    // Report time is now in minutes directly from the report content
    const reportTimeMinutes = typeof report_time === "number" ? report_time : 1;
    console.log(
      `Using report time: ${reportTimeMinutes} minutes from elapsed time`
    );

    // Map report status to valid enum values
    // Valid values: 'completed', 'pending', 'rejected', 'draft'
    let mappedStatus = "completed";

    if (status === "draft") {
      mappedStatus = "draft";
    } else if (status === "pending" || status === "submitted") {
      mappedStatus = "pending";
    } else if (status === "rejected") {
      mappedStatus = "rejected";
    } else if (status === "approved" || status === "completed") {
      mappedStatus = "completed";
    }

    console.log(
      `Mapping report status '${status}' to user_performance status '${mappedStatus}'`
    );

    // Validate required fields
    if (!client_id || !user_id || !report_id || !report_name) {
      console.error("Missing required fields for user performance tracking", {
        client_id,
        user_id,
        report_id,
        report_name,
      });
      return false;
    }

    // Get a database connection
    const connection = await db.getConnection();

    try {
      // First, check if we need to add the required columns
      try {
        // Check and add creation_timestamp column if needed
        const [timestampColumnExists] = await connection.query(
          "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_performance' AND column_name = 'creation_timestamp'"
        );

        if (timestampColumnExists[0].count === 0) {
          // Add the creation_timestamp column
          await connection.query(`
            ALTER TABLE user_performance 
            ADD COLUMN creation_timestamp DATETIME NULL AFTER report_time
          `);
          console.log(
            "Added creation_timestamp column to user_performance table"
          );
        }

        // Check and add elapsed_seconds column if needed
        const [secondsColumnExists] = await connection.query(
          "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_performance' AND column_name = 'elapsed_seconds'"
        );

        if (secondsColumnExists[0].count === 0) {
          // Add the elapsed_seconds column
          await connection.query(`
            ALTER TABLE user_performance 
            ADD COLUMN elapsed_seconds INT NULL AFTER creation_timestamp
          `);
          console.log("Added elapsed_seconds column to user_performance table");
        }
      } catch (columnError) {
        console.error("Error checking/adding columns:", columnError);
      }

      // Check if a record already exists for this combination
      const [existingRecord] = await connection.query(
        "SELECT * FROM user_performance WHERE client_id = ? AND user_id = ? AND report_id = ?",
        [client_id, user_id, report_id]
      );

      if (existingRecord.length > 0) {
        // Update existing record
        await connection.query(
          `UPDATE user_performance 
           SET report_time = ?, creation_timestamp = ?, elapsed_seconds = ?, status = ?, score = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE client_id = ? AND user_id = ? AND report_id = ?`,
          [
            reportTimeMinutes,
            formattedTimestamp,
            elapsed_seconds || null,
            mappedStatus,
            score,
            client_id,
            user_id,
            report_id,
          ]
        );
        console.log(
          `Updated performance record for user ${user_id} on report ${report_id}`
        );
      } else {
        // Insert new record
        await connection.query(
          `INSERT INTO user_performance 
           (client_id, user_id, report_id, report_name, report_time, creation_timestamp, elapsed_seconds, status, score) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            client_id,
            user_id,
            report_id,
            report_name,
            reportTimeMinutes,
            formattedTimestamp,
            elapsed_seconds || null,
            mappedStatus,
            score,
          ]
        );
        console.log(
          `Added new performance record for user ${user_id} on report ${report_id}`
        );
      }

      connection.release();
      return true;
    } catch (error) {
      console.error("Error tracking user performance:", error);
      connection.release();
      return false;
    }
  } catch (error) {
    console.error("Failed to track user performance:", error);
    return false;
  }
};

/**
 * Calculate time taken to complete a report based on start and end timestamps
 *
 * @param {Date|string} startTime - When the report was created or last updated
 * @param {Date|string} endTime - When the report was completed (now)
 * @returns {number} - Time in minutes
 */
const calculateReportTime = (startTime, endTime) => {
  try {
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime instanceof Date ? endTime : new Date(endTime);

    // Calculate difference in milliseconds
    const diffMs = end - start;

    // Convert to minutes, rounded to nearest minute
    const minutes = Math.round(diffMs / (1000 * 60));

    // Ensure a reasonable value - minimum 1 minute, maximum 24 hours
    if (minutes < 1) return 1;
    if (minutes > 24 * 60) return 24 * 60;

    return minutes;
  } catch (error) {
    console.error("Error calculating report time:", error);
    return 30; // Default to 30 minutes
  }
};

/**
 * Get user performance summary for a specific user
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserPerformanceSummary = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { client_id, start_date, end_date } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get a database connection
    const connection = await db.getConnection();

    try {
      // Build query with optional filters
      let query = `
        SELECT 
          up.user_id,
          u.name as user_name,
          u.email as user_email,
          c.name as client_name,
          COUNT(up.report_id) as total_reports,
          AVG(up.report_time) as avg_report_time,
          MIN(up.report_time) as min_report_time,
          MAX(up.report_time) as max_report_time,
          SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) as completed_reports,
          SUM(CASE WHEN up.status = 'pending' THEN 1 ELSE 0 END) as pending_reports,
          SUM(CASE WHEN up.status = 'rejected' THEN 1 ELSE 0 END) as rejected_reports,
          AVG(up.score) as avg_score
        FROM 
          user_performance up
        JOIN
          users u ON up.user_id = u.id
        JOIN
          clients c ON up.client_id = c.id
        WHERE 
          up.user_id = ?
      `;

      const queryParams = [user_id];

      // Add optional filters
      if (client_id) {
        query += " AND up.client_id = ?";
        queryParams.push(client_id);
      }

      if (start_date) {
        query += " AND up.created_at >= ?";
        queryParams.push(start_date);
      }

      if (end_date) {
        query += " AND up.created_at <= ?";
        queryParams.push(end_date);
      }

      // Group by user_id
      query += " GROUP BY up.user_id, u.name, u.email, c.name";

      // Execute the query
      const [summary] = await connection.query(query, queryParams);

      // Get recent reports
      const [recentReports] = await connection.query(
        `SELECT 
          up.report_id,
          up.report_name,
          up.report_time,
          up.status,
          up.score,
          up.created_at,
          up.elapsed_seconds,
          c.name as client_name
        FROM 
          user_performance up
        JOIN
          clients c ON up.client_id = c.id
        WHERE 
          up.user_id = ?
        ORDER BY 
          up.created_at DESC
        LIMIT 10`,
        [user_id]
      );

      // Get current day reports to calculate average completion time
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      )
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59
      )
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      // Query to get all reports for the user, including today's reports
      const [allReports] = await connection.query(
        `SELECT 
          up.report_id,
          up.elapsed_seconds,
          up.report_time,
          up.created_at
        FROM 
          user_performance up
        WHERE 
          up.user_id = ?
        ORDER BY 
          up.created_at DESC`,
        [user_id]
      );

      // Filter for today's reports
      const currentDayReports = allReports.filter((report) => {
        const reportDate = new Date(report.created_at);
        return (
          reportDate >= new Date(startOfDay) && reportDate <= new Date(endOfDay)
        );
      });

      // Calculate average completion time from elapsed_seconds for ALL reports
      // (both for today and for all time)
      let currentDayAvgTime = null;
      let currentDayAvgTimeFormatted = null;
      let allTimeAvgSeconds = null;
      let allTimeAvgTimeFormatted = null;

      console.log("Total reports:", allReports.length);
      console.log("Today's reports:", currentDayReports.length);

      // Calculate average for all reports with valid elapsed_seconds
      const validReportsWithElapsedTime = allReports.filter(
        (report) => report.elapsed_seconds && !isNaN(report.elapsed_seconds)
      );

      if (validReportsWithElapsedTime.length > 0) {
        const totalElapsedSeconds = validReportsWithElapsedTime.reduce(
          (sum, report) => sum + report.elapsed_seconds,
          0
        );
        // elapsed_seconds is already in seconds (e.g., 120 seconds = 2 minutes)
        allTimeAvgSeconds =
          totalElapsedSeconds / validReportsWithElapsedTime.length;

        // Format the all-time average - correctly converting seconds to minutes and seconds
        const mins = Math.floor(allTimeAvgSeconds / 60);
        const secs = Math.round(allTimeAvgSeconds % 60);
        allTimeAvgTimeFormatted = `${mins}m ${secs}s`;

        console.log(
          `Calculated ALL TIME average from ${validReportsWithElapsedTime.length} reports: ${allTimeAvgTimeFormatted}`
        );

        // Update the summary record with this calculated value
        if (summary.length > 0) {
          summary[0].avg_report_time = allTimeAvgSeconds / 60; // Convert to minutes
          summary[0].avg_report_time_formatted = allTimeAvgTimeFormatted;
        }
      }

      // Also calculate average specifically for today's reports
      if (currentDayReports && currentDayReports.length > 0) {
        // First try to calculate using elapsed_seconds (which are more accurate)
        const todayReportsWithElapsedTime = currentDayReports.filter(
          (report) => report.elapsed_seconds && !isNaN(report.elapsed_seconds)
        );

        if (todayReportsWithElapsedTime.length > 0) {
          const totalElapsedSeconds = todayReportsWithElapsedTime.reduce(
            (sum, report) => sum + report.elapsed_seconds,
            0
          );
          // elapsed_seconds is already in seconds
          const avgElapsedSeconds =
            totalElapsedSeconds / todayReportsWithElapsedTime.length;

          // Convert to minutes for the minute value field only
          currentDayAvgTime = Math.round(avgElapsedSeconds / 60);

          // Format correctly from seconds to minutes and seconds display
          const mins = Math.floor(avgElapsedSeconds / 60);
          const secs = Math.round(avgElapsedSeconds % 60);
          currentDayAvgTimeFormatted = `${mins}m ${secs}s`;

          console.log(
            `Calculated TODAY's average time from ${todayReportsWithElapsedTime.length} reports: ${currentDayAvgTimeFormatted}`
          );
        } else {
          // Fallback to using report_time if elapsed_seconds data is not available
          const validReportsWithTime = currentDayReports.filter(
            (report) => report.report_time && !isNaN(report.report_time)
          );

          if (validReportsWithTime.length > 0) {
            const totalMinutes = validReportsWithTime.reduce(
              (sum, report) => sum + report.report_time,
              0
            );
            currentDayAvgTime = Math.round(
              totalMinutes / validReportsWithTime.length
            );

            // Create formatted time
            const mins = Math.floor(currentDayAvgTime);
            const secs = Math.round((currentDayAvgTime - mins) * 60);
            currentDayAvgTimeFormatted = `${mins}m ${secs}s`;

            console.log(
              `Calculated TODAY's average (fallback) from ${validReportsWithTime.length} reports: ${currentDayAvgTimeFormatted}`
            );
          }
        }
      }

      connection.release();

      if (summary.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No performance data found for this user",
        });
      }

      // Ensure the summary data includes the all-time average in a consistent format
      if (summary.length > 0) {
        // If we calculated all-time average from elapsed_seconds, use it
        if (allTimeAvgTimeFormatted) {
          summary[0].average_completion_time_formatted =
            allTimeAvgTimeFormatted;
          // Also include with the more standardized naming convention
          summary[0].avgCompletionTimeFormatted = allTimeAvgTimeFormatted;
        }
      }

      console.log("allTimeAvgTimeFormatted", allTimeAvgTimeFormatted);

      return res.status(200).json({
        success: true,
        data: {
          summary: summary[0],
          recentReports,
          currentDayPerformance: {
            reportCount: currentDayReports?.length || 0,
            avgTime: currentDayAvgTime,
            avgTimeFormatted: currentDayAvgTimeFormatted,
          },
          allTimePerformance: {
            reportCount: allReports?.length || 0,
            avgTime: allTimeAvgSeconds
              ? Math.round(allTimeAvgSeconds / 60)
              : null,
            avgTimeFormatted: allTimeAvgTimeFormatted,
          },
        },
      });
    } catch (error) {
      console.error("Database error in getUserPerformanceSummary:", error);
      connection.release();
      return res.status(500).json({
        success: false,
        message: "Database error while retrieving user performance",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Error in getUserPerformanceSummary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user performance data",
      error: error.message,
    });
  }
};

/**
 * Get performance data for all users in a client
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getClientUsersPerformance = async (req, res) => {
  try {
    const { client_id } = req.params;
    const { start_date, end_date, limit = 10, page = 1 } = req.query;

    if (!client_id) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required",
      });
    }

    // Parse pagination parameters
    const pageLimit = parseInt(limit) || 10;
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * pageLimit;

    // Get a database connection
    const connection = await db.getConnection();

    try {
      // Build base query with optional filters
      let baseQuery = `
        FROM 
          user_performance up
        JOIN
          users u ON up.user_id = u.id
        WHERE 
          up.client_id = ?
      `;

      const queryParams = [client_id];

      // Add optional date filters
      if (start_date) {
        baseQuery += " AND up.created_at >= ?";
        queryParams.push(start_date);
      }

      if (end_date) {
        baseQuery += " AND up.created_at <= ?";
        queryParams.push(end_date);
      }

      // Get total count for pagination
      const [countResult] = await connection.query(
        `SELECT COUNT(DISTINCT up.user_id) as total ${baseQuery}`,
        queryParams
      );

      const total = countResult[0]?.total || 0;

      // Query for user summaries with pagination
      const [userSummaries] = await connection.query(
        `SELECT 
          up.user_id,
          u.name as user_name,
          u.email as user_email,
          COUNT(up.report_id) as total_reports,
          AVG(up.report_time) as avg_report_time,
          SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) as completed_reports,
          AVG(up.score) as avg_score
        ${baseQuery}
        GROUP BY 
          up.user_id, u.name, u.email
        ORDER BY 
          total_reports DESC, avg_report_time ASC
        LIMIT ?, ?`,
        [...queryParams, offset, pageLimit]
      );

      // Get overall client summary
      const [clientSummary] = await connection.query(
        `SELECT 
          COUNT(up.report_id) as total_reports,
          AVG(up.report_time) as avg_report_time,
          COUNT(DISTINCT up.user_id) as total_users,
          SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) as completed_reports,
          AVG(up.score) as avg_score
        ${baseQuery}`,
        queryParams
      );

      connection.release();

      return res.status(200).json({
        success: true,
        data: {
          clientSummary: clientSummary[0],
          userSummaries,
        },
        pagination: {
          total,
          currentPage: pageNum,
          totalPages: Math.ceil(total / pageLimit),
          limit: pageLimit,
        },
      });
    } catch (error) {
      console.error("Database error in getClientUsersPerformance:", error);
      connection.release();
      return res.status(500).json({
        success: false,
        message: "Database error while retrieving client users performance",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Error in getClientUsersPerformance:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve client users performance data",
      error: error.message,
    });
  }
};

module.exports = {
  trackUserPerformance,
  calculateReportTime,
  getUserPerformanceSummary,
  getClientUsersPerformance,
};
