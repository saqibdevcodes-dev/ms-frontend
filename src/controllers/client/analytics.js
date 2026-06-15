const db = require("../../database/sql");

/**
 * Process analytics dashboard data
 * @param {Object} request - HTTP request
 * @param {Object} response - HTTP response
 */
async function getAnalyticsDashboard(request, response) {
  try {
    const { client_id, year, scope_id } = request.body;

    if (!client_id) {
      return response.status(400).json({
        message: "Client ID is required",
      });
    }

    // Get a database connection
    const connection = await db.getConnection();

    try {
      // Get client data to verify client exists
      const [clientRows] = await connection.query(
        "SELECT uuid, name FROM clients WHERE uuid = ?",
        [client_id]
      );

      if (clientRows.length === 0) {
        return response.status(404).json({
          message: "Client not found",
        });
      }

      // Current year as default if not specified
      const selectedYear = year || new Date().getFullYear().toString();

      // Base query for fetching reports data
      let reportsQuery = `
        SELECT r.id, r.score, r.branch_id, r.content, 
               r.created_at, b.branch_name, s.scope
        FROM reports r
        LEFT JOIN branches b ON r.branch_id = b.id
        LEFT JOIN branch_scopes s ON r.scope_id = s.id
        WHERE r.client_id = ?
        AND YEAR(r.created_at) = ?
        AND r.score IS NOT NULL
      `;

      const queryParams = [client_id, selectedYear];

      // Add scope filter if provided
      if (scope_id) {
        reportsQuery += " AND r.scope_id = ?";
        queryParams.push(scope_id);
      }

      // Execute the query
      const [reports] = await connection.query(reportsQuery, queryParams);

      // Process data for analytics
      const processedData = processReportsForAnalytics(reports);

      return response.status(200).json({
        status: "success",
        message: "Analytics data fetched successfully",
        data: processedData,
      });
    } finally {
      // Release the connection
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return response.status(500).json({
      message: "An error occurred while fetching analytics data",
      error: error.message,
    });
  }
}

/**
 * Process reports data into analytics format
 * @param {Array} reports - Raw reports data from database
 * @returns {Object} Processed data for analytics dashboard
 */
function processReportsForAnalytics(reports) {
  // Initialize result structure
  const result = {
    yearly_data: [],
    monthly_data: [],
    branch_scores: [],
    scores_by_scope: [],
  };

  // Process monthly averages
  const monthlyData = {};

  reports.forEach((report) => {
    const date = new Date(report.created_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        date: date,
        totalScore: 0,
        count: 0,
      };
    }

    monthlyData[monthKey].totalScore += report.score || 0;
    monthlyData[monthKey].count++;
  });

  // Calculate monthly averages
  Object.values(monthlyData).forEach((month) => {
    result.monthly_data.push({
      date: month.date.toISOString().split("T")[0],
      score: Math.round(month.totalScore / month.count),
    });
  });

  // The yearly_data is just a reference to the monthly_data for now
  result.yearly_data = result.monthly_data;

  // Process branch scores
  const branchData = {};

  reports.forEach((report) => {
    const branchKey = report.branch_id?.toString() || "unknown";
    const branchName = report.branch_name || `Branch ${branchKey}`;

    if (!branchData[branchKey]) {
      branchData[branchKey] = {
        id: report.branch_id,
        name: branchName,
        totalScore: 0,
        count: 0,
      };
    }

    branchData[branchKey].totalScore += report.score || 0;
    branchData[branchKey].count++;
  });

  // Calculate branch averages
  Object.values(branchData).forEach((branch) => {
    result.branch_scores.push({
      id: branch.id,
      name: branch.name,
      score: Math.round(branch.totalScore / branch.count),
    });
  });

  // Process scope scores
  const scopeData = {};

  reports.forEach((report) => {
    if (!report.scope) return;

    const scopeKey = report.scope?.toString() || "unknown";

    if (!scopeData[scopeKey]) {
      scopeData[scopeKey] = {
        name: report.scope,
        totalScore: 0,
        count: 0,
      };
    }

    scopeData[scopeKey].totalScore += report.score || 0;
    scopeData[scopeKey].count++;
  });

  // Calculate scope averages
  Object.values(scopeData).forEach((scope) => {
    result.scores_by_scope.push({
      name: scope.name,
      score: Math.round(scope.totalScore / scope.count),
    });
  });

  return result;
}

/**
 * Get list of scopes for a client
 * @param {Object} request - HTTP request
 * @param {Object} response - HTTP response
 */
async function getScopesList(request, response) {
  try {
    const { client_id } = request.query;

    if (!client_id) {
      return response.status(400).json({
        message: "Client ID is required",
      });
    }

    // Get a database connection
    const connection = await db.getConnection();

    try {
      // Get scopes for this client
      const [scopesRows] = await connection.query(
        `SELECT id, scope as name, scope_key 
         FROM branch_scopes 
         WHERE client_id = ?`,
        [client_id]
      );

      return response.status(200).json({
        status: "success",
        message: "Scopes fetched successfully",
        data: scopesRows || [],
      });
    } finally {
      // Release the connection
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching scopes list:", error);
    return response.status(500).json({
      message: "An error occurred while fetching scopes list",
      error: error.message,
    });
  }
}

module.exports = {
  getAnalyticsDashboard,
  getScopesList,
};
