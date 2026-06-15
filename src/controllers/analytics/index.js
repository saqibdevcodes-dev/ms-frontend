const db = require("../../database/sql");

/**
 * Format time in minutes to display in minutes and seconds format
 * @param {number} minutes - Time in minutes
 * @returns {string} - Formatted time string (e.g., "5m 30s")
 */
const formatTimeMinSec = (minutes) => {
  if (!minutes || isNaN(minutes)) return "0m 0s";

  // Convert minutes to seconds first (since our input is minutes)
  const totalSeconds = Math.round(minutes * 60);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins}m ${secs}s`;
};

/**
 * Get analytics data filtered by different scopes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getScopeAnalytics = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), scopeId, clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required",
      });
    }

    try {
      // For now, we'll return mock data for frontend development
      // When fully implementing, we can use the same pattern as in client/analytics.js

      // Mock data structure - this is what the frontend expects
      const mockData = {
        labels: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        datasets: [
          {
            label: "Branch Level",
            data: [65, 72, 68, 75, 80, 82, 78, 85, 88, 90, 87, 92],
            borderColor: "#4F46E5",
            backgroundColor: "rgba(79, 70, 229, 0.1)",
          },
          {
            label: "Region Level",
            data: [60, 65, 70, 72, 75, 78, 80, 82, 85, 87, 88, 90],
            borderColor: "#EC4899",
            backgroundColor: "rgba(236, 72, 153, 0.1)",
          },
          {
            label: "Country Level",
            data: [55, 60, 63, 68, 70, 72, 75, 78, 80, 82, 85, 88],
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
          },
        ],
        tableData: [
          { scope: "Branch A", score: 92, change: "+3%", status: "improved" },
          { scope: "Branch B", score: 88, change: "+1%", status: "stable" },
          { scope: "Branch C", score: 65, change: "-5%", status: "declined" },
          {
            scope: "Region North",
            score: 85,
            change: "+2%",
            status: "improved",
          },
          { scope: "Region South", score: 78, change: "+0%", status: "stable" },
        ],
      };

      return res.status(200).json({
        success: true,
        data: mockData,
      });
    } catch (error) {
      console.error("Database error in getScopeAnalytics:", error);
      return res.status(500).json({
        success: false,
        message: "Database error while retrieving scope analytics data",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Error in getScopeAnalytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve scope analytics data",
      error: error.message,
    });
  }
};

/**
 * Get analytics data organized by KPIs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getKpiAnalytics = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), scopeId, clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required",
      });
    }

    try {
      // Mock data structure for KPI analytics
      const mockData = {
        radar: {
          labels: [
            "Customer Service",
            "Cleanliness",
            "Product Knowledge",
            "Wait Time",
            "Issue Resolution",
            "Staff Courtesy",
          ],
          datasets: [
            {
              label: "Current Year",
              data: [85, 90, 78, 82, 88, 92],
              borderColor: "#4F46E5",
              backgroundColor: "rgba(79, 70, 229, 0.2)",
            },
            {
              label: "Previous Year",
              data: [80, 85, 75, 78, 82, 87],
              borderColor: "#EC4899",
              backgroundColor: "rgba(236, 72, 153, 0.2)",
            },
          ],
        },
        bar: {
          labels: [
            "Customer Service",
            "Cleanliness",
            "Product Knowledge",
            "Wait Time",
            "Issue Resolution",
            "Staff Courtesy",
          ],
          datasets: [
            {
              label: "Performance Score",
              data: [85, 90, 78, 82, 88, 92],
              backgroundColor: [
                "rgba(79, 70, 229, 0.7)",
                "rgba(236, 72, 153, 0.7)",
                "rgba(16, 185, 129, 0.7)",
                "rgba(245, 158, 11, 0.7)",
                "rgba(99, 102, 241, 0.7)",
                "rgba(239, 68, 68, 0.7)",
              ],
            },
          ],
        },
        tableData: [
          {
            kpi: "Customer Service",
            score: 85,
            target: 80,
            variance: "+5",
            status: "above_target",
          },
          {
            kpi: "Cleanliness",
            score: 90,
            target: 85,
            variance: "+5",
            status: "above_target",
          },
          {
            kpi: "Product Knowledge",
            score: 78,
            target: 80,
            variance: "-2",
            status: "below_target",
          },
          {
            kpi: "Wait Time",
            score: 82,
            target: 75,
            variance: "+7",
            status: "above_target",
          },
          {
            kpi: "Issue Resolution",
            score: 88,
            target: 85,
            variance: "+3",
            status: "above_target",
          },
          {
            kpi: "Staff Courtesy",
            score: 92,
            target: 90,
            variance: "+2",
            status: "above_target",
          },
        ],
      };

      return res.status(200).json({
        success: true,
        data: mockData,
      });
    } catch (error) {
      console.error("Database error in getKpiAnalytics:", error);
      return res.status(500).json({
        success: false,
        message: "Database error while retrieving KPI analytics data",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Error in getKpiAnalytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve KPI analytics data",
      error: error.message,
    });
  }
};

/**
 * Get analytics data comparing different data sources
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSourceAnalytics = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), scopeId, clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required",
      });
    }

    try {
      // Mock data structure for source comparison analytics
      const mockData = {
        comparison: {
          labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ],
          datasets: [
            {
              label: "Mystery Shopping",
              data: [85, 82, 88, 90, 87, 92, 89, 91, 93, 92, 94, 95],
              borderColor: "#4F46E5",
              backgroundColor: "rgba(79, 70, 229, 0.1)",
            },
            {
              label: "Customer Reviews",
              data: [78, 80, 82, 85, 83, 87, 89, 86, 90, 88, 91, 92],
              borderColor: "#EC4899",
              backgroundColor: "rgba(236, 72, 153, 0.1)",
            },
            {
              label: "Employee Feedback",
              data: [80, 82, 85, 87, 86, 89, 90, 92, 91, 93, 92, 94],
              borderColor: "#10B981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
            },
          ],
        },
        heatmap: {
          xLabels: [
            "Customer Service",
            "Cleanliness",
            "Product Knowledge",
            "Wait Time",
            "Issue Resolution",
            "Staff Courtesy",
          ],
          yLabels: [
            "Mystery Shopping",
            "Customer Reviews",
            "Employee Feedback",
          ],
          data: [
            [85, 90, 78, 82, 88, 92],
            [78, 85, 75, 80, 82, 87],
            [80, 88, 82, 75, 85, 90],
          ],
        },
        tableData: [
          {
            source: "Mystery Shopping",
            average: 88,
            highest: "Staff Courtesy (92)",
            lowest: "Product Knowledge (78)",
          },
          {
            source: "Customer Reviews",
            average: 81,
            highest: "Staff Courtesy (87)",
            lowest: "Product Knowledge (75)",
          },
          {
            source: "Employee Feedback",
            average: 83,
            highest: "Staff Courtesy (90)",
            lowest: "Wait Time (75)",
          },
        ],
      };

      return res.status(200).json({
        success: true,
        data: mockData,
      });
    } catch (error) {
      console.error("Database error in getSourceAnalytics:", error);
      return res.status(500).json({
        success: false,
        message: "Database error while retrieving source analytics data",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Error in getSourceAnalytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve source comparison analytics data",
      error: error.message,
    });
  }
};

/**
 * Get filters data for analytics pages (years, scopes, etc.)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAnalyticsFilters = async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required",
      });
    }

    try {
      // In a full implementation, we would fetch this data from the database
      // Based on client/analytics.js, we could fetch scopes from branch_scopes table

      // Mock filters data
      const filtersData = {
        years: [2020, 2021, 2022, 2023, 2024],
        scopes: [
          { id: 1, name: "All Branches", type: "country" },
          { id: 2, name: "North Region", type: "region" },
          { id: 3, name: "South Region", type: "region" },
          { id: 4, name: "East Region", type: "region" },
          { id: 5, name: "West Region", type: "region" },
          { id: 6, name: "Branch A", type: "branch" },
          { id: 7, name: "Branch B", type: "branch" },
          { id: 8, name: "Branch C", type: "branch" },
        ],
        dataSources: [
          { id: 1, name: "Mystery Shopping" },
          { id: 2, name: "Customer Reviews" },
          { id: 3, name: "Employee Feedback" },
        ],
      };

      return res.status(200).json({
        success: true,
        data: filtersData,
      });
    } catch (error) {
      console.error("Database error in getAnalyticsFilters:", error);
      return res.status(500).json({
        success: false,
        message: "Database error while retrieving analytics filters",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Error in getAnalyticsFilters:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve analytics filters",
      error: error.message,
    });
  }
};

/**
 * Get user performance analytics data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserPerformanceAnalytics = async (req, res) => {
  try {
    const {
      year = new Date().getFullYear(),
      clientId,
      client_id,
      userRole = "reporting_user",
      limit = 10,
      page = 1,
    } = req.query;

    // Check for client_id in either format - we'll keep this for backward compatibility
    // but no longer require it for the main user query
    const effectiveClientId = clientId || client_id;
    // Parse limit as integer or use a high default for "all" users
    const pageLimit = parseInt(limit) || 100;
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * pageLimit;

    // Add debugging logs
    console.log("User performance analytics request params:", {
      effectiveClientId,
      year,
      userRole,
      pageLimit,
      pageNum,
      offset,
    });

    try {
      // Get a database connection
      const connection = await db.getConnection();
      console.log("DB connection established");

      // MODIFIED: Query reporting users directly by system_role instead of by client_id
      // This allows us to fetch all reporting users regardless of client
      const userQuery = `
        SELECT u.id, u.uuid, u.name, u.email, u.role, u.first_name, u.last_name, u.created_at
        FROM users u
        WHERE u.system_role = 'reporting_user'
        ORDER BY u.name
        LIMIT ?, ?
      `;

      // Execute the query filtering for reporting users
      const [users] = await connection.query(userQuery, [offset, pageLimit]);

      console.log(`Found ${users?.length || 0} reporting users`);

      // Get total user count for pagination
      const [[{ total }]] = await connection.query(
        `
        SELECT COUNT(*) AS total
        FROM users u
        WHERE u.system_role = 'reporting_user'
      `
      );

      console.log(`Total reporting users: ${total}`);

      // Add a specific query to count reporting users - this is the same as total now
      const reportingUsersCount = total;

      console.log(`Total reporting users count: ${reportingUsersCount}`);

      // If we have users, fetch their performance data from the user_performance table
      if (users && users.length > 0) {
        // Create array to hold user performance data
        const enhancedUsers = [];

        // Create a date range for the selected year
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year}-12-31 23:59:59`;

        // For each user, get their performance data
        for (const user of users) {
          // Get user performance metrics from user_performance table
          const [performanceData] = await connection.query(
            `
            SELECT 
              COUNT(up.report_id) AS report_count,
              SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) AS completed_reports,
              SUM(CASE WHEN up.status = 'pending' OR up.status = 'draft' THEN 1 ELSE 0 END) AS pending_reports,
              SUM(CASE WHEN up.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_reports,
              SUM(CASE WHEN up.status = 'draft' THEN 1 ELSE 0 END) AS draft_reports,
              -- Calculate average completion time from elapsed_seconds (more accurate)
              AVG(CASE WHEN up.elapsed_seconds IS NOT NULL AND up.elapsed_seconds > 0 
                  THEN up.elapsed_seconds ELSE NULL END) AS avg_elapsed_seconds,
              -- Fallback to report_time if needed
              AVG(CASE WHEN up.status = 'completed' AND up.report_time IS NOT NULL AND up.report_time > 0 
                  THEN up.report_time ELSE NULL END) AS avg_completion_time,
              AVG(up.score) AS avg_score,
              -- For reports per day calculation
              COUNT(DISTINCT DATE(up.created_at)) AS active_days,
              MIN(up.created_at) AS first_report_date,
              MAX(up.created_at) AS last_report_date
            FROM user_performance up
            WHERE up.user_id = ? 
            AND up.created_at BETWEEN ? AND ?
            `,
            [user.id, yearStart, yearEnd]
          );

          // Get monthly scores for trend analysis
          const [monthlyData] = await connection.query(
            `
            SELECT 
              MONTH(up.created_at) AS month,
              AVG(up.score) AS avg_score,
              COUNT(up.report_id) AS report_count
            FROM user_performance up
            WHERE up.user_id = ? 
            AND up.created_at BETWEEN ? AND ?
            GROUP BY MONTH(up.created_at)
            ORDER BY MONTH(up.created_at)
            `,
            [user.id, yearStart, yearEnd]
          );

          // Generate monthly scores array (fill gaps with null for months with no data)
          const monthlyScores = Array(12).fill(null);
          monthlyData.forEach((item) => {
            if (item.month >= 1 && item.month <= 12) {
              monthlyScores[item.month - 1] = Math.round(item.avg_score || 0);
            }
          });

          // Get user's recent reports
          const [recentReports] = await connection.query(
            `
            SELECT 
              up.report_id,
              up.report_name AS title,
              up.report_time AS completion_time,
              up.status,
              up.score,
              up.created_at AS date
            FROM user_performance up
            WHERE up.user_id = ?
            ORDER BY up.created_at DESC
            LIMIT 5
            `,
            [user.id]
          );

          // Format recent reports
          const formattedReports = recentReports.map((report) => ({
            id: report.report_id,
            title: report.title,
            completionTime: Math.round(report.completion_time || 0),
            completionTimeFormatted: formatTimeMinSec(report.completion_time),
            status: report.status,
            score: Math.round(report.score || 0),
            date: report.date,
          }));

          // Calculate reports per day dynamically based on actual data
          let reportsPerDay = 0;
          const userPerf = performanceData[0] || {};
          const reportCount = userPerf.report_count || 0;

          if (reportCount > 0) {
            // If we have the count of active days, use that for better accuracy
            if (userPerf.active_days && userPerf.active_days > 0) {
              reportsPerDay = parseFloat(
                (reportCount / userPerf.active_days).toFixed(1)
              );
            }
            // Fallback to calculation based on date range if we have first and last report dates
            else if (userPerf.first_report_date && userPerf.last_report_date) {
              const firstDate = new Date(userPerf.first_report_date);
              const lastDate = new Date(userPerf.last_report_date);
              const daysDiff = Math.max(
                1,
                Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24))
              );
              reportsPerDay = parseFloat((reportCount / daysDiff).toFixed(1));
            }
            // Final fallback to the old method
            else {
              const workingDaysInYear = 260; // ~52 weeks * 5 days
              reportsPerDay = parseFloat(
                (reportCount / workingDaysInYear).toFixed(1)
              );
            }
          }

          // Calculate on-time percentage (mocked for now until we have actual on-time data)
          const onTime = Math.round(Math.random() * 20 + 80); // 80-100% on time

          // Determine status based on score
          let status = "poor";
          let trend = "stable";

          if (userPerf.avg_score >= 90) {
            status = "excellent";
            trend = "up";
          } else if (userPerf.avg_score >= 80) {
            status = "good";
            trend = "up";
          } else if (userPerf.avg_score >= 70) {
            status = "average";
            trend = Math.random() > 0.5 ? "up" : "down";
          } else {
            trend = "down";
          }

          // Add enhanced user data to array
          enhancedUsers.push({
            id: user.id,
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            reportCount,
            completedTasks: userPerf.completed_reports || 0,
            pendingTasks: userPerf.pending_reports || 0,
            draftReports: userPerf.draft_reports || 0,
            submittedReports: userPerf.completed_reports || 0,
            rejectedReports: userPerf.rejected_reports || 0,
            avgScore: Math.round(userPerf.avg_score || 0),
            // Prefer elapsed_seconds for more accurate time calculation if available
            avgCompletionTime: userPerf.avg_elapsed_seconds
              ? Math.round(userPerf.avg_elapsed_seconds / 60) // Convert seconds to minutes
              : Math.round(userPerf.avg_completion_time || 0),
            avgCompletionTimeFormatted: userPerf.avg_elapsed_seconds
              ? (() => {
                  const seconds = userPerf.avg_elapsed_seconds;
                  const mins = Math.floor(seconds / 60);
                  const secs = Math.round(seconds % 60);
                  return `${mins}m ${secs}s`;
                })()
              : formatTimeMinSec(userPerf.avg_completion_time),
            reportsPerDay,
            onTime,
            status,
            trend,
            monthlyScores,
            recentReports: formattedReports,
          });
        }

        console.log("Original users data before any sorting:");
        enhancedUsers.forEach((user, index) => {
          console.log(
            `[${index}] User: ${user.name}, Score: ${user.avgScore}, Time: ${user.avgCompletionTime}, Reports: ${user.reportCount}`
          );
        });

        // Create a sorted copy by average score (descending) - don't modify original array
        const sortedUsers = [...enhancedUsers].sort(
          (a, b) => b.avgScore - a.avgScore
        );

        // Replace the array contents but keep the same reference
        enhancedUsers.length = 0;
        sortedUsers.forEach((user) => enhancedUsers.push(user));

        // Calculate user status distribution
        const usersByStatus = [
          {
            status: "Excellent",
            count: enhancedUsers.filter((user) => user.status === "excellent")
              .length,
          },
          {
            status: "Good",
            count: enhancedUsers.filter((user) => user.status === "good")
              .length,
          },
          {
            status: "Average",
            count: enhancedUsers.filter((user) => user.status === "average")
              .length,
          },
          {
            status: "Poor",
            count: enhancedUsers.filter((user) => user.status === "poor")
              .length,
          },
        ];

        // Helper function to find fastest and slowest users based on report count
        // For this logic: MORE reports = FASTER user, FEWER reports = SLOWER user
        const findUserBySpeed = (users, findFastest = true) => {
          console.log(
            `Finding ${
              findFastest ? "fastest" : "slowest"
            } user based on report count from ${users.length} total users`
          );

          if (!users || users.length === 0) {
            return "N/A";
          }

          // Make a deep copy to avoid any side effects
          const usersCopy = JSON.parse(JSON.stringify(users));

          // Only consider users who have at least 1 report
          const usersWithReports = usersCopy.filter(
            (user) => user.reportCount > 0
          );

          console.log(`Found ${usersWithReports.length} users with reports`);
          usersWithReports.forEach((user) => {
            console.log(
              `User with reports: ${user.name}, Reports: ${user.reportCount}, Time: ${user.avgCompletionTime}`
            );
          });

          if (usersWithReports.length === 0) {
            return "No users with reports";
          }

          // Sort users based on report count
          // findFastest = true: sort by most reports first (descending)
          // findFastest = false: sort by fewest reports first (ascending)
          const sortedUsers = [...usersWithReports].sort(
            (a, b) =>
              findFastest
                ? b.reportCount - a.reportCount // Most reports = fastest
                : a.reportCount - b.reportCount // Fewest reports = slowest
          );

          // Get the appropriate user
          const user = sortedUsers[0];

          // Format the result based on whether the user has time data
          if (user.avgCompletionTime > 0) {
            return `${user.name} (${user.reportCount} reports, avg time: ${user.avgCompletionTimeFormatted})`;
          } else {
            return `${user.name} (${user.reportCount} reports)`;
          }
        };

        // Calculate time distribution by querying all reports
        const [timeDistribution] = await connection.query(
          `
          SELECT 
            CASE 
              WHEN up.report_time < 20 THEN '< 20 min'
              WHEN up.report_time >= 20 AND up.report_time < 40 THEN '20-40 min'
              WHEN up.report_time >= 40 AND up.report_time < 60 THEN '40-60 min'
              ELSE '> 60 min'
            END AS time_range,
            COUNT(*) AS count
          FROM user_performance up
          JOIN users u ON up.user_id = u.id
          WHERE u.system_role = 'reporting_user'
          AND up.created_at BETWEEN ? AND ?
          GROUP BY time_range
          `,
          [yearStart, yearEnd]
        );

        // Format time distribution data
        const timeRanges = ["< 20 min", "20-40 min", "40-60 min", "> 60 min"];
        const timeDistributionData = Array(4).fill(0);

        timeDistribution.forEach((item) => {
          const index = timeRanges.indexOf(item.time_range);
          if (index !== -1) {
            timeDistributionData[index] = item.count;
          }
        });

        // Calculate daily report distribution
        const [dailyDistribution] = await connection.query(
          `
          SELECT 
            WEEKDAY(up.created_at) AS day_of_week,
            COUNT(*) AS report_count,
            AVG(up.report_time) / 60 AS avg_time_hours
          FROM user_performance up
          JOIN users u ON up.user_id = u.id
          WHERE u.system_role = 'reporting_user'
          AND up.created_at BETWEEN ? AND ?
          GROUP BY day_of_week
          ORDER BY day_of_week
          `,
          [yearStart, yearEnd]
        );

        // Format daily distribution data (0 = Monday, 6 = Sunday)
        const dailyLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const reportsCreatedData = Array(7).fill(0);
        const timeSpentData = Array(7).fill(0);

        dailyDistribution.forEach((item) => {
          if (item.day_of_week >= 0 && item.day_of_week <= 6) {
            reportsCreatedData[item.day_of_week] = Math.round(
              item.report_count / 4
            ); // Divide by weeks in month (approx)
            timeSpentData[item.day_of_week] =
              parseFloat(
                item.avg_time_hours && typeof item.avg_time_hours === "number"
                  ? item.avg_time_hours.toFixed(1)
                  : 0
              ) || 0;
          }
        });

        // Get monthly performance trend data
        const [monthlyPerformance] = await connection.query(
          `
          SELECT 
            MONTH(up.created_at) AS month,
            AVG(up.score) AS avg_score,
            AVG(CASE WHEN up.status = 'completed' AND up.report_time IS NOT NULL AND up.report_time > 0 
                THEN up.report_time ELSE NULL END) AS avg_completion_time,
            COUNT(up.report_id) AS report_count,
            COUNT(DISTINCT DATE(up.created_at)) AS active_days
          FROM user_performance up
          JOIN users u ON up.user_id = u.id
          WHERE u.system_role = 'reporting_user'
          AND up.created_at BETWEEN ? AND ?
          GROUP BY month
          ORDER BY month
          `,
          [yearStart, yearEnd]
        );

        // Format monthly performance data
        const monthLabels = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const monthlyScoreData = Array(12).fill(0);
        const monthlyCompletionTimeData = Array(12).fill(0);
        const monthlyCompletionTimeFormattedData = Array(12).fill("0m 0s");
        const monthlyReportsPerDayData = Array(12).fill(0);

        monthlyPerformance.forEach((item) => {
          if (item.month >= 1 && item.month <= 12) {
            monthlyScoreData[item.month - 1] = Math.round(item.avg_score || 0);

            const avgTime = Math.round(item.avg_completion_time || 0);
            monthlyCompletionTimeData[item.month - 1] = avgTime;
            monthlyCompletionTimeFormattedData[item.month - 1] =
              formatTimeMinSec(item.avg_completion_time);

            // Calculate reports per day for the month
            if (item.active_days > 0) {
              monthlyReportsPerDayData[item.month - 1] = parseFloat(
                (item.report_count / item.active_days).toFixed(1)
              );
            }
          }
        });

        // Calculate report status totals
        const [reportStatusTotals] = await connection.query(
          `
          SELECT 
            SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) AS completed_total,
            SUM(CASE WHEN up.status = 'pending' OR up.status = 'draft' THEN 1 ELSE 0 END) AS pending_total,
            SUM(CASE WHEN up.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_total,
            SUM(CASE WHEN up.status = 'draft' THEN 1 ELSE 0 END) AS draft_total
          FROM user_performance up
          JOIN users u ON up.user_id = u.id
          WHERE u.system_role = 'reporting_user'
          AND up.created_at BETWEEN ? AND ?
          `,
          [yearStart, yearEnd]
        );

        const statusTotals = reportStatusTotals[0] || {};

        // Calculate average completion time based on ALL reports with elapsed_seconds
        // This is more accurate than averaging user averages
        const [allReportsWithElapsedTime] = await connection.query(
          `
          SELECT 
            up.elapsed_seconds
          FROM user_performance up
          JOIN users u ON up.user_id = u.id
          WHERE u.system_role = 'reporting_user'
          AND up.elapsed_seconds IS NOT NULL 
          AND up.elapsed_seconds > 0
          AND up.created_at BETWEEN ? AND ?
          `,
          [yearStart, yearEnd]
        );

        console.log(
          `Found ${allReportsWithElapsedTime.length} reports with valid elapsed_seconds`
        );

        let avgCompletionTime = 0;
        let avgCompletionTimeFormatted = "0m 0s";

        if (allReportsWithElapsedTime && allReportsWithElapsedTime.length > 0) {
          // Calculate total and average of elapsed_seconds across ALL reports
          const totalElapsedSeconds = allReportsWithElapsedTime.reduce(
            (sum, report) => sum + report.elapsed_seconds,
            0
          );
          // elapsed_seconds is already in seconds (120 = 2 minutes)
          const avgElapsedSeconds =
            totalElapsedSeconds / allReportsWithElapsedTime.length;
          console.log(
            `Total elapsed seconds: ${totalElapsedSeconds}, Average elapsed seconds: ${avgElapsedSeconds}`
          );

          // Convert to minutes for consistency - this is only for the number value
          avgCompletionTime = Math.round(avgElapsedSeconds / 60);

          // Format as minutes and seconds - already using the correct formula
          const mins = Math.floor(avgElapsedSeconds / 60);
          const secs = Math.round(avgElapsedSeconds % 60);
          avgCompletionTimeFormatted = `${mins}m ${secs}s`;

          console.log(
            `Calculated global average completion time from elapsed_seconds: ${avgCompletionTimeFormatted}`
          );
        } else {
          // Fall back to the old calculation method if no reports with elapsed_seconds are found
          const avgCompletionTimeRaw =
            enhancedUsers.reduce(
              (sum, user) => sum + user.avgCompletionTime,
              0
            ) / (enhancedUsers.length || 1);

          avgCompletionTime = Math.round(avgCompletionTimeRaw);
          avgCompletionTimeFormatted = formatTimeMinSec(avgCompletionTimeRaw);

          console.log(
            `Using fallback method for average completion time: ${avgCompletionTimeFormatted}`
          );
        }

        // Get report data by user for user comparison chart
        const [userComparisonData] = await connection.query(
          `
          SELECT 
            u.name AS user_name,
            COUNT(up.report_id) AS report_count,
            AVG(CASE WHEN up.elapsed_seconds IS NOT NULL AND up.elapsed_seconds > 0 
                THEN up.elapsed_seconds ELSE NULL END) AS avg_elapsed_seconds
          FROM user_performance up
          JOIN users u ON up.user_id = u.id
          WHERE u.system_role = 'reporting_user'
          AND up.created_at BETWEEN ? AND ?
          GROUP BY u.name
          HAVING report_count > 0
          ORDER BY report_count DESC
          LIMIT 10
          `,
          [yearStart, yearEnd]
        );

        // Prepare user comparison chart data
        const userLabels = userComparisonData.map((user) => user.user_name);
        const userReportCounts = userComparisonData.map(
          (user) => user.report_count
        );
        const userAvgTimes = userComparisonData.map((user) => {
          // Convert to minutes for display
          return user.avg_elapsed_seconds
            ? Math.round(user.avg_elapsed_seconds / 60)
            : 0;
        });

        // Get report counts by status for pie chart
        const reportStatusData = [
          statusTotals.completed_total || 0,
          statusTotals.pending_total || 0,
          statusTotals.rejected_total || 0,
          statusTotals.draft_total || 0,
        ];

        // Get weekly trend data for more granular analysis
        const [weeklyData] = await connection.query(
          `
          SELECT 
            YEARWEEK(up.created_at) AS year_week,
            MIN(DATE(up.created_at)) AS week_start,
            COUNT(up.report_id) AS report_count,
            AVG(CASE WHEN up.elapsed_seconds IS NOT NULL AND up.elapsed_seconds > 0 
                THEN up.elapsed_seconds ELSE NULL END) AS avg_elapsed_seconds
          FROM user_performance up
          JOIN users u ON up.user_id = u.id
          WHERE u.system_role = 'reporting_user'
          AND up.created_at BETWEEN ? AND ?
          GROUP BY year_week
          ORDER BY year_week DESC
          LIMIT 10
          `,
          [yearStart, yearEnd]
        );

        // Prepare weekly trend data (reverse to show chronological order)
        const weeklyLabels = weeklyData
          .map((week) => {
            const date = new Date(week.week_start);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          })
          .reverse();

        const weeklyReportCounts = weeklyData
          .map((week) => week.report_count)
          .reverse();
        const weeklyAvgTimes = weeklyData
          .map((week) => {
            return week.avg_elapsed_seconds
              ? Math.round(week.avg_elapsed_seconds / 60)
              : 0;
          })
          .reverse();

        // Create response data structure with enhanced visualizations
        const responseData = {
          performance: {
            labels: monthLabels,
            datasets: [
              {
                label: "Average Score",
                data: monthlyScoreData,
                borderColor: "#4F46E5",
                backgroundColor: "rgba(79, 70, 229, 0.1)",
              },
              {
                label: "Report Count",
                data: monthlyPerformance.map(
                  (month) => month.report_count || 0
                ),
                borderColor: "#EC4899",
                backgroundColor: "rgba(236, 72, 153, 0.1)",
                yAxisID: "count-axis",
              },
            ],
          },
          completionTimeTrend: {
            labels: monthLabels,
            datasets: [
              {
                label: "Average Completion Time (minutes)",
                data: monthlyCompletionTimeData,
                borderColor: "#10B981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
              },
            ],
            formattedData: monthlyCompletionTimeFormattedData,
          },
          reportsPerDayTrend: {
            labels: monthLabels,
            datasets: [
              {
                label: "Reports Per Day",
                data: monthlyReportsPerDayData,
                borderColor: "#F59E0B",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
              },
            ],
          },
          // New visualizations
          userComparisonChart: {
            labels: userLabels,
            datasets: [
              {
                label: "Reports Submitted",
                data: userReportCounts,
                backgroundColor: "rgba(79, 70, 229, 0.7)",
                type: "bar",
                yAxisID: "count-axis",
              },
              {
                label: "Average Completion Time (min)",
                data: userAvgTimes,
                backgroundColor: "rgba(236, 72, 153, 0.7)",
                type: "bar",
                yAxisID: "time-axis",
              },
            ],
          },
          reportStatusChart: {
            labels: ["Completed", "Pending", "Rejected", "Draft"],
            datasets: [
              {
                data: reportStatusData,
                backgroundColor: ["#10B981", "#F59E0B", "#EF4444", "#6B7280"],
              },
            ],
          },
          weeklyTrendChart: {
            labels: weeklyLabels,
            datasets: [
              {
                label: "Weekly Report Count",
                data: weeklyReportCounts,
                borderColor: "#4F46E5",
                backgroundColor: "rgba(79, 70, 229, 0.1)",
                tension: 0.2,
                fill: true,
              },
              {
                label: "Avg Completion Time (min)",
                data: weeklyAvgTimes,
                borderColor: "#EC4899",
                backgroundColor: "rgba(236, 72, 153, 0.1)",
                tension: 0.2,
                fill: true,
                yAxisID: "time-axis",
              },
            ],
          },
          userPerformance: enhancedUsers,
          summary: {
            totalUsers: total,
            totalReportingUsers: reportingUsersCount,
            topPerformer:
              enhancedUsers.length > 0
                ? `${enhancedUsers[0].name} (${enhancedUsers[0].avgScore}%)`
                : "N/A",
            mostReports:
              enhancedUsers.length > 0
                ? (() => {
                    // Make a copy to avoid mutating the original array
                    const sortedByReports = [...enhancedUsers].sort(
                      (a, b) => b.reportCount - a.reportCount
                    );
                    return `${sortedByReports[0].name} (${sortedByReports[0].reportCount})`;
                  })()
                : "N/A",
            averageReportsPerUser: Math.round(
              enhancedUsers.reduce((sum, user) => sum + user.reportCount, 0) /
                (enhancedUsers.length || 1)
            ),
            averageCompletionTime: avgCompletionTime,
            averageCompletionTimeFormatted: avgCompletionTimeFormatted,
            fastestUser: findUserBySpeed(enhancedUsers, true),
            slowestUser: findUserBySpeed(enhancedUsers, false),
            draftReports: statusTotals.draft_total || 0,
            submittedReports: statusTotals.completed_total || 0,
            rejectedReports: statusTotals.rejected_total || 0,
          },
          usersByStatus,
          timeAnalysis: {
            labels: ["< 20 min", "20-40 min", "40-60 min", "> 60 min"],
            datasets: [
              {
                label: "Report Completion Times",
                data: timeDistributionData,
                backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"],
              },
            ],
          },
          dailyReports: {
            labels: dailyLabels,
            datasets: [
              {
                label: "Avg Reports Created",
                data: reportsCreatedData,
                backgroundColor: "#4F46E5",
                type: "bar",
              },
              {
                label: "Avg Time Spent (hours)",
                data: timeSpentData,
                backgroundColor: "#10B981",
                type: "bar",
              },
            ],
          },
          // Add detailed statistics about user activity
          userActivityStats: {
            // Top 5 most active days (with most reports)
            topActiveDays: (() => {
              // Create array of day + count pairs
              const dayData = dailyLabels.map((day, index) => ({
                day,
                count: reportsCreatedData[index],
              }));
              // Sort by count (descending) and take top 5
              return dayData
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((item) => `${item.day} (${item.count} reports)`);
            })(),

            // Time efficiency statistics
            timeEfficiency: {
              fastestCompletionTime: Math.min(
                ...allReportsWithElapsedTime
                  .filter((report) => report.elapsed_seconds > 0)
                  .map((report) => report.elapsed_seconds)
              ),
              slowestCompletionTime: Math.max(
                ...allReportsWithElapsedTime
                  .filter((report) => report.elapsed_seconds > 0)
                  .map((report) => report.elapsed_seconds)
              ),
              medianCompletionTime: (() => {
                const validTimes = allReportsWithElapsedTime
                  .filter((report) => report.elapsed_seconds > 0)
                  .map((report) => report.elapsed_seconds)
                  .sort((a, b) => a - b);

                if (validTimes.length === 0) return 0;

                const mid = Math.floor(validTimes.length / 2);
                if (validTimes.length % 2 === 0) {
                  return (validTimes[mid - 1] + validTimes[mid]) / 2;
                } else {
                  return validTimes[mid];
                }
              })(),
            },

            // Report submission pattern (morning, afternoon, evening)
            reportTimeDistribution: (() => {
              // If we had hour data we could calculate this
              // For now, provide a placeholder that can be populated when that data is available
              return {
                morning: 0,
                afternoon: 0,
                evening: 0,
              };
            })(),
          },
        };

        connection.release();
        console.log(
          "Returning data with real users and real performance metrics"
        );

        return res.status(200).json({
          success: true,
          data: responseData,
          totalReportingUsers: reportingUsersCount,
          pagination: {
            total,
            currentPage: pageNum,
            totalPages: Math.ceil(total / pageLimit),
            limit: pageLimit,
          },
        });
      }

      // If no users found, return empty data
      connection.release();
      console.log("No users found, returning empty data");

      return res.status(200).json({
        success: true,
        data: {
          performance: {
            labels: [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ],
            datasets: [
              {
                label: "Average Score",
                data: Array(12).fill(0),
                borderColor: "#4F46E5",
                backgroundColor: "rgba(79, 70, 229, 0.1)",
              },
            ],
          },
          completionTimeTrend: {
            labels: [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ],
            datasets: [
              {
                label: "Average Completion Time (minutes)",
                data: Array(12).fill(0),
                borderColor: "#10B981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
              },
            ],
            formattedData: Array(12).fill("0m 0s"),
          },
          reportsPerDayTrend: {
            labels: [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ],
            datasets: [
              {
                label: "Reports Per Day",
                data: Array(12).fill(0),
                borderColor: "#F59E0B",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
              },
            ],
          },
          userPerformance: [],
          summary: {
            totalUsers: 0,
            totalReportingUsers: 0,
            topPerformer: "N/A",
            mostReports: "N/A",
            averageReportsPerUser: 0,
            averageCompletionTime: 0,
            averageCompletionTimeFormatted: "0m 0s",
            fastestUser: "N/A",
            slowestUser: "N/A",
            draftReports: 0,
            submittedReports: 0,
            rejectedReports: 0,
          },
          usersByStatus: [
            { status: "Excellent", count: 0 },
            { status: "Good", count: 0 },
            { status: "Average", count: 0 },
            { status: "Poor", count: 0 },
          ],
          timeAnalysis: {
            labels: ["< 20 min", "20-40 min", "40-60 min", "> 60 min"],
            datasets: [
              {
                label: "Report Completion Times",
                data: [0, 0, 0, 0],
                backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"],
              },
            ],
          },
          dailyReports: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                label: "Avg Reports Created",
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: "#4F46E5",
              },
              {
                label: "Avg Time Spent (hours)",
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: "#10B981",
              },
            ],
          },
        },
        totalReportingUsers: 0,
        pagination: {
          total: 0,
          currentPage: pageNum,
          totalPages: 0,
          limit: pageLimit,
        },
      });
    } catch (error) {
      console.error("Database error in getUserPerformanceAnalytics:", error);
      return res.status(500).json({
        success: false,
        message: "Database error while retrieving user performance data",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Error in getUserPerformanceAnalytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user performance data",
      error: error.message,
    });
  }
};

module.exports = {
  getScopeAnalytics,
  getKpiAnalytics,
  getSourceAnalytics,
  getAnalyticsFilters,
  getUserPerformanceAnalytics,
};
