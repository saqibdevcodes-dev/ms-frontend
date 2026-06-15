const db = require("../../database/sql");
const {
  trackUserPerformance,
  calculateReportTime,
} = require("./user_performance");

/**
 * Save a report
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
// const saveReport = async (req, res) => {
//   try {
//     const {
//       client_id,
//       template_name,
//       colors,
//       content,
//       status,
//       user_id: requestUserId,
//       id: bodyId, // Allow ID to be passed in the body
//       table, // Allow table to be specified in the body
//       media_links, // Extract media links from request
//       visits_add, // Extract the visits_add flag from request body
//     } = req.body;

//     // Check if this is an update request (PUT) by checking for ID in URL params
//     const reportId = req.params.id || bodyId;
//     const isUpdate = !!reportId;

//     // Use user_id from request payload if provided, otherwise fall back to JWT token
//     const user_id = requestUserId || req.user?.id || null;

//     //
//     //   "User ID for report creation/update:",
//     //   user_id,
//     //   "Request payload ID:",
//     //   requestUserId,
//     //   "JWT token ID:",
//     //   req.user?.id
//     // );

//     //
//     //   "Report operation:",
//     //   isUpdate ? "UPDATE" : "CREATE",
//     //   "Report ID:",
//     //   reportId,
//     //   "Table:",
//     //   table
//     // );

//     if (!client_id || !template_name) {
//       return res.status(400).json({
//         error: "Client ID and template name are required",
//       });
//     }

//     //
//     //

//     // Default status to 'draft' if not provided
//     const reportStatus = status || "draft";

//     // If updating and table is provided in the query, use it
//     const tableFromQuery = req.query.table;
//     const clientReportsTableOverride = tableFromQuery || table;

//     // Get a connection from the pool
//     const connection = await db.getConnection();

//     try {
//       // First, get the client name for the table name
//       //

//       // Try to normalize UUID format if needed
//       let normalizedClientId = client_id;
//       if (typeof client_id === "string" && client_id.includes("-")) {
//         // Keep UUID format as is for lookup
//         normalizedClientId = client_id;
//       }

//       const [clientResult] = await connection.query(
//         "SELECT id, name FROM clients WHERE id = ?",
//         [normalizedClientId]
//       );

//       //

//       if (clientResult.length === 0) {
//         // Try alternative lookup if using UUID string
//         //
//         //   "Client not found with primary lookup, trying alternative lookup"
//         // );
//         const [altClientResult] = await connection.query(
//           "SELECT id, name FROM clients WHERE uuid = ?",
//           [client_id]
//         );

//

//         if (altClientResult.length === 0) {
//           return res.status(404).json({
//             error: "Client not found. Tried with ID: " + client_id,
//           });
//         }

//         // Use client from alternative lookup
//         clientResult[0] = altClientResult[0];
//       }

//       // Format client name to be used in table name (remove spaces, special chars)
//       const clientName = clientResult[0].name
//         .replace(/\s+/g, "_") // Replace spaces with underscores
//         .replace(/[^a-zA-Z0-9_]/g, "") // Remove special characters
//         .toLowerCase();

//       // Define the client-specific reports table name
//       // If directly updating with a specific table, use that instead
//       const clientReportsTable =
//         clientReportsTableOverride || `${clientName}_reports`;
//

//       // Extract primary field information from the content
//       let primaryFieldName = "branch_code"; // Default to branch_code
//       let primaryFieldValue = null;

//       // Check if content has a specific primaryField object (new format)
//       if (content && typeof content === "object" && content.primaryField) {
//         primaryFieldName = content.primaryField.name;
//         primaryFieldValue = content.primaryField.value;
//         //
//         //   `Using primaryField from content: ${primaryFieldName} = ${primaryFieldValue}`
//         // );
//       }
//       // Fallback to the old method if primaryField is not directly available
//       else if (
//         content &&
//         typeof content === "object" &&
//         content.primaryIdentifierField &&
//         content.selectedFieldValues
//       ) {
//         primaryFieldName = content.primaryIdentifierField;

//         // Get the value for the primary field
//         const primaryFieldObj = content.selectedFieldValues[primaryFieldName];
//         if (primaryFieldObj) {
//           // If it's an object with value property (from dropdown)
//           if (typeof primaryFieldObj === "object" && primaryFieldObj.value) {
//             primaryFieldValue = primaryFieldObj.value;
//           } else if (
//             typeof primaryFieldObj === "object" &&
//             primaryFieldObj.name
//           ) {
//             primaryFieldValue = primaryFieldObj.name;
//           } else {
//             primaryFieldValue = primaryFieldObj;
//           }
//         }

//         //
//         //   `Using dynamic primary field: ${primaryFieldName} = ${primaryFieldValue}`
//         // );
//       } else {
//         //
//         //   "No primary field defined in content, using default primary field name"
//         // );
//       }

//       // Handle the visits_add flag for visit numbering
//       // If visits_add is true, add a visit number suffix to the primary field value
//       if (visits_add === true && primaryFieldValue) {
//         //

//         // Check if table exists before querying
//         const [tableCheck] = await connection.query(
//           "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
//           [clientReportsTable]
//         );

//         // Only proceed with visit numbering if the table exists
//         if (tableCheck[0].count > 0) {
//           // Query existing reports with the same primary field value pattern
//           const [existingVisits] = await connection.query(
//             `SELECT primary_field_value FROM ${clientReportsTable}
//             WHERE primary_field_name = ? AND primary_field_value LIKE ?`,
//             [primaryFieldName, `${primaryFieldValue}-visit-%`]
//           );

//           //
//           //   `Found ${existingVisits.length} existing visits for ${primaryFieldValue}`
//           // );

//           // Find the highest visit number
//           let maxVisitNumber = 0;
//           existingVisits.forEach((report) => {
//             const match = report.primary_field_value.match(/-visit-(\d+)$/);
//             if (match && match[1]) {
//               const visitNumber = parseInt(match[1], 10);
//               if (!isNaN(visitNumber) && visitNumber > maxVisitNumber) {
//                 maxVisitNumber = visitNumber;
//               }
//             }
//           });

//           // Append visit number to primary field value
//           primaryFieldValue = `${primaryFieldValue}-visit-${
//             maxVisitNumber + 1
//           }`;
//           //
//           //   `Using visit-numbered primary field value: ${primaryFieldValue}`
//           // );
//         } else {
//           // If table doesn't exist yet, this is the first report, so use visit-1
//           primaryFieldValue = `${primaryFieldValue}-visit-1`;
//           //
//           //   `First report for this client, using: ${primaryFieldValue}`
//           // );
//         }
//       }

//       // If this is a direct update to a specific report ID (PUT request)
//       if (isUpdate && reportId) {
//         // Check if the table exists
//         const [tableExists] = await connection.query(
//           "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
//           [clientReportsTable]
//         );

//         if (tableExists[0].count === 0) {
//           return res.status(404).json({
//             error: `Table ${clientReportsTable} does not exist`,
//           });
//         }

//         // Check if the report exists in the table
//         const [reportExists] = await connection.query(
//           `SELECT id FROM ${clientReportsTable} WHERE id = ?`,
//           [reportId]
//         );

//         if (reportExists.length === 0) {
//           return res.status(404).json({
//             error: `Report with ID ${reportId} not found in table ${clientReportsTable}`,
//           });
//         }

//         // Update the existing report
//
//           `Directly updating report with ID: ${reportId} in table: ${clientReportsTable}`
//         );

//         // Extract timestamp_url from the request for updates
//         const timestamp_url = req.body.timestamp_url || null;
//

//         await connection.query(
//           `UPDATE ${clientReportsTable}
//            SET primary_field_name = ?, primary_field_value = ?, colors = ?, content = ?, status = ?, updated_by = ?, updated_at = NOW(), template_name = ?,
//            video_url = ?, audio_url = ?, images_urls = ?, timestamp_url = ?
//            WHERE id = ?`,
//           [
//             primaryFieldName,
//             primaryFieldValue,
//             JSON.stringify(colors || {}),
//             JSON.stringify(content || {}),
//             reportStatus,
//             user_id,
//             template_name,
//             media_links?.video_link || null,
//             media_links?.audio_link || null,
//             media_links?.image_link
//               ? JSON.stringify([media_links.image_link])
//               : null,
//             timestamp_url,
//             reportId,
//           ]
//         );

//         // Track user performance
//         try {
//           // Get the report start time - either from the existing record or use a default (30 mins ago)
//           let reportStartTime = new Date();
//           reportStartTime.setMinutes(reportStartTime.getMinutes() - 30); // Default 30 mins ago

//           // For updates, try to get the previous update time
//           const [existingReport] = await connection.query(
//             `SELECT updated_at FROM ${clientReportsTable} WHERE id = ?`,
//             [reportId]
//           );

//           if (existingReport.length > 0) {
//             reportStartTime =
//               existingReport[0].updated_at || existingReport[0].created_at;
//           }

//           // Try to extract elapsed time from content
//           let elapsedTimeInSeconds = 0;

//           if (content && typeof content === "object") {
//             // Try to extract elapsedTimeSeconds from timerInfo first (new format)
//             if (content.timerInfo && content.timerInfo.elapsedTimeSeconds) {
//               elapsedTimeInSeconds = content.timerInfo.elapsedTimeSeconds;
//               //
//               //   `Found elapsedTimeSeconds in timerInfo: ${elapsedTimeInSeconds} seconds`
//               // );
//             }
//             // Try to extract elapsedTimeSeconds directly
//             else if (content.elapsedTimeSeconds) {
//               elapsedTimeInSeconds = content.elapsedTimeSeconds;
//               //
//               //   `Found elapsedTimeSeconds in content: ${elapsedTimeInSeconds} seconds`
//               // );
//             }
//             // Also look for it in nested structures
//             else if (
//               content.reportInfo &&
//               content.reportInfo.elapsedTimeSeconds
//             ) {
//               elapsedTimeInSeconds = content.reportInfo.elapsedTimeSeconds;
//
//                 `Found elapsedTimeSeconds in reportInfo: ${elapsedTimeInSeconds} seconds`
//               );
//             }
//             // Try other possible locations
//             else if (content.metadata && content.metadata.elapsedTimeSeconds) {
//               elapsedTimeInSeconds = content.metadata.elapsedTimeSeconds;
//
//                 `Found elapsedTimeSeconds in metadata: ${elapsedTimeInSeconds} seconds`
//               );
//             }
//           }

//           let reportTime;
//           // If we found elapsed time in seconds in the content, use that
//           if (elapsedTimeInSeconds > 0) {
//             // Convert seconds to minutes for storage, with minimum of 1 minute
//             reportTime = Math.max(1, Math.round(elapsedTimeInSeconds / 60));
//
//               `Converting ${elapsedTimeInSeconds} seconds to ${reportTime} minutes for report_time in update flow`
//             );
//           } else {
//             // Fall back to calculated time based on timestamps
//             reportTime = calculateReportTime(reportStartTime, new Date());
//
//               `Using calculated report time: ${reportTime} minutes (from timestamps)`
//             );
//           }

//           // Get the current timestamp
//           const reportCreationTime = new Date();

//           // Track the performance
//           await trackUserPerformance({
//             client_id: clientResult[0].id, // Use numeric client ID
//             user_id: user_id,
//             report_id: reportId,
//             report_name: template_name,
//             report_time: reportTime,
//             creation_timestamp: reportCreationTime,
//             elapsed_seconds: elapsedTimeInSeconds,
//             status: reportStatus,
//             score: null, // Score will be added later when implemented
//           });
//         } catch (perfError) {
//           // Non-blocking - log but don't fail the request
//           console.error("Error tracking user performance:", perfError);
//         }

//         return res.status(200).json({
//           success: true,
//           message: `Report with ID ${reportId} updated successfully in ${clientReportsTable}`,
//           data: {
//             id: reportId,
//             table: clientReportsTable,
//             primary_field: {
//               name: primaryFieldName,
//               value: primaryFieldValue,
//             },
//             timestamp_url: timestamp_url,
//           },
//         });
//       }

//       // Continue with normal flow for non-direct updates...
//       // Check if the client-specific table exists
//       const [tableExists] = await connection.query(
//         "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
//         [clientReportsTable]
//       );

//       if (tableExists[0].count === 0) {
//

//         // Create the client-specific reports table with dynamic primary field
//         await connection.query(`
//           CREATE TABLE ${clientReportsTable} (
//             id INT AUTO_INCREMENT PRIMARY KEY,
//             client_id VARCHAR(255) NOT NULL,
//             template_name VARCHAR(255) NOT NULL,
//             primary_field_name VARCHAR(100) NOT NULL,
//             primary_field_value VARCHAR(255),
//             colors JSON,
//             content JSON,
//             status VARCHAR(50) DEFAULT 'draft',
//             created_by INT DEFAULT NULL,
//             updated_by INT DEFAULT NULL,
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//             video_url TEXT DEFAULT NULL,
//             audio_url TEXT DEFAULT NULL,
//             images_urls JSON DEFAULT NULL,
//             timestamp_url TEXT DEFAULT NULL
//           )
//         `);
//       } else {
//         // Check if the primary_field_name column exists
//         const [checkPrimaryFieldName] = await connection.query(
//           `
//           SELECT COUNT(*) as count
//           FROM information_schema.columns
//           WHERE
//             table_schema = DATABASE()
//             AND table_name = ?
//             AND column_name = 'primary_field_name'
//         `,
//           [clientReportsTable]
//         );

//         // Check if the primary_field_value column exists
//         const [checkPrimaryFieldValue] = await connection.query(
//           `
//           SELECT COUNT(*) as count
//           FROM information_schema.columns
//           WHERE
//             table_schema = DATABASE()
//             AND table_name = ?
//             AND column_name = 'primary_field_value'
//         `,
//           [clientReportsTable]
//         );

//         // After the existing column checks, add checks for the media URL columns
//         // Check if the video_url column exists
//         const [checkVideoUrl] = await connection.query(
//           `
//           SELECT COUNT(*) as count
//           FROM information_schema.columns
//           WHERE
//             table_schema = DATABASE()
//             AND table_name = ?
//             AND column_name = 'video_url'
//         `,
//           [clientReportsTable]
//         );

//         // Check if the audio_url column exists
//         const [checkAudioUrl] = await connection.query(
//           `
//           SELECT COUNT(*) as count
//           FROM information_schema.columns
//           WHERE
//             table_schema = DATABASE()
//             AND table_name = ?
//             AND column_name = 'audio_url'
//         `,
//           [clientReportsTable]
//         );

//         // Check if the images_urls column exists
//         const [checkImagesUrls] = await connection.query(
//           `
//           SELECT COUNT(*) as count
//           FROM information_schema.columns
//           WHERE
//             table_schema = DATABASE()
//             AND table_name = ?
//             AND column_name = 'images_urls'
//         `,
//           [clientReportsTable]
//         );

//         // Check if timestamp_url column exists
//         const [checkTimestampUrl] = await connection.query(
//           `
//           SELECT COUNT(*) as count
//           FROM information_schema.columns
//           WHERE
//             table_schema = DATABASE()
//             AND table_name = ?
//             AND column_name = 'timestamp_url'
//         `,
//           [clientReportsTable]
//         );

//         // Add primary_field_name column if it doesn't exist
//         if (checkPrimaryFieldName[0].count === 0) {
//           await connection.query(`
//             ALTER TABLE ${clientReportsTable}
//             ADD COLUMN primary_field_name VARCHAR(100) NOT NULL DEFAULT 'branch_code'
//           `);
//         }

//         // Add primary_field_value column if it doesn't exist
//         if (checkPrimaryFieldValue[0].count === 0) {
//           await connection.query(`
//             ALTER TABLE ${clientReportsTable}
//             ADD COLUMN primary_field_value VARCHAR(255)
//           `);
//         }

//         // Add video_url column if it doesn't exist
//         if (checkVideoUrl[0].count === 0) {
//           await connection.query(`
//             ALTER TABLE ${clientReportsTable}
//             ADD COLUMN video_url TEXT DEFAULT NULL
//           `);
//         }

//         // Add audio_url column if it doesn't exist
//         if (checkAudioUrl[0].count === 0) {
//           await connection.query(`
//             ALTER TABLE ${clientReportsTable}
//             ADD COLUMN audio_url TEXT DEFAULT NULL
//           `);
//         }

//         // Add images_urls column if it doesn't exist
//         if (checkImagesUrls[0].count === 0) {
//           await connection.query(`
//             ALTER TABLE ${clientReportsTable}
//             ADD COLUMN images_urls JSON DEFAULT NULL
//           `);
//         }

//         // Add timestamp_url column if it doesn't exist
//         if (checkTimestampUrl[0].count === 0) {
//           await connection.query(`
//             ALTER TABLE ${clientReportsTable}
//             ADD COLUMN timestamp_url TEXT DEFAULT NULL
//           `);
//         }

//         // Check if branch_code column exists and copy values if needed
//         const [branchCodeCheck] = await connection.query(
//           `
//           SELECT COUNT(*) as count
//           FROM information_schema.columns
//           WHERE
//             table_schema = DATABASE()
//             AND table_name = ?
//             AND column_name = 'branch_code'
//         `,
//           [clientReportsTable]
//         );

//         // If branch_code exists, copy values to primary_field_value for backward compatibility
//         if (branchCodeCheck[0].count > 0) {
//           await connection.query(`
//             UPDATE ${clientReportsTable}
//             SET primary_field_value = branch_code
//             WHERE primary_field_value IS NULL AND branch_code IS NOT NULL
//           `);
//         }
//       }

//       // First check if a report with the exact same template name already exists
//       const [existingByName] = await connection.query(
//         `SELECT id FROM ${clientReportsTable} WHERE client_id = ? AND template_name = ?`,
//         [client_id, template_name]
//       );

//       // If this is a direct update with ID specified (PUT request), update the existing report
//       if (isUpdate && reportId) {
//         // This case is already handled above
//         // Just left here for clarity of logic flow
//       }
//       // For regular POST requests (new reports)
//       else {
//         // Check for existing reports with the same primary field value
//         if (primaryFieldValue) {
//           // Get all reports with the same primary field name and value (or similar with -1, -2 suffixes)
//           const [similarReports] = await connection.query(
//             `SELECT primary_field_value FROM ${clientReportsTable}
//              WHERE client_id = ? AND primary_field_name = ? AND (primary_field_value = ? OR primary_field_value LIKE ?)`,
//             [
//               client_id,
//               primaryFieldName,
//               primaryFieldValue,
//               `${primaryFieldValue}-%`,
//             ]
//           );

//           // If there are similar reports, always add a suffix instead of updating
//           if (similarReports.length > 0) {
//
//               `Found ${similarReports.length} similar reports with the primary field ${primaryFieldName}`
//             );

//             // Get the highest suffix number
//             let maxSuffix = 0;
//             let basePrimaryValue = primaryFieldValue;
//             let hasSuffix = false;

//             similarReports.forEach((report) => {
//               // Check if this exact value already exists (without suffix)
//               if (report.primary_field_value === primaryFieldValue) {
//                 hasSuffix = true; // Mark that we need a suffix
//               }

//               // Handle values with dash and number suffix like "ABC-1", "ABC-2"
//               if (report.primary_field_value.includes("-")) {
//                 const parts = report.primary_field_value.split("-");
//                 const lastPart = parts[parts.length - 1];
//                 const suffix = parseInt(lastPart);

//                 // If the base value matches and the suffix is a number
//                 if (
//                   !isNaN(suffix) &&
//                   report.primary_field_value.startsWith(`${basePrimaryValue}-`)
//                 ) {
//                   if (suffix > maxSuffix) {
//                     maxSuffix = suffix;
//                   }
//                 }
//               }
//             });

//             // If an exact match exists or we have suffixed versions, add/increment suffix
//             if (hasSuffix || maxSuffix > 0) {
//               primaryFieldValue = `${basePrimaryValue}-${maxSuffix + 1}`;
//
//                 `Creating new report with incremented primary field value: ${primaryFieldValue}`
//               );

//               // Update the content object to reflect the new primary field value
//               if (content && typeof content === "object") {
//                 if (content.primaryField) {
//                   content.primaryField.value = primaryFieldValue;
//                 } else if (
//                   content.selectedFieldValues &&
//                   content.primaryIdentifierField
//                 ) {
//                   // Update in the old format as well if needed
//                   const fieldName = content.primaryIdentifierField;
//                   if (content.selectedFieldValues[fieldName]) {
//                     if (
//                       typeof content.selectedFieldValues[fieldName] === "object"
//                     ) {
//                       content.selectedFieldValues[fieldName].value =
//                         primaryFieldValue;
//                     } else {
//                       content.selectedFieldValues[fieldName] =
//                         primaryFieldValue;
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }

//         // Always create a new report (with incremented suffix if needed)
//
//           "Creating new report with primary field value:",
//           primaryFieldValue
//         );

//         // Extract timestamp_url from the request
//         const timestamp_url = req.body.timestamp_url || null;
//

//         const [result] = await connection.query(
//           `INSERT INTO ${clientReportsTable}
//            (client_id, template_name, primary_field_name, primary_field_value, colors, content, status, created_by, updated_by, video_url, audio_url, images_urls, timestamp_url)
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             client_id,
//             template_name,
//             primaryFieldName,
//             primaryFieldValue,
//             JSON.stringify(colors || {}),
//             JSON.stringify(content || {}),
//             reportStatus,
//             user_id,
//             user_id,
//             media_links?.video_link || null,
//             media_links?.audio_link || null,
//             media_links?.image_link
//               ? JSON.stringify([media_links.image_link])
//               : null,
//             timestamp_url,
//           ]
//         );

//         // Track user performance
//         try {
//           // For new reports, use the actual creation timestamp
//           const reportCreationTime = new Date(); // Current time when report is created

//           // Try to extract elapsed time from content
//           let elapsedTimeInSeconds = 0;

//           if (content && typeof content === "object") {
//             // Try to extract elapsedTimeSeconds from timerInfo first (new format)
//             if (content.timerInfo && content.timerInfo.elapsedTimeSeconds) {
//               elapsedTimeInSeconds = content.timerInfo.elapsedTimeSeconds;
//
//                 `Found elapsedTimeSeconds in timerInfo: ${elapsedTimeInSeconds} seconds`
//               );
//             }
//             // Try to extract elapsedTimeSeconds directly
//             else if (content.elapsedTimeSeconds) {
//               elapsedTimeInSeconds = content.elapsedTimeSeconds;
//
//                 `Found elapsedTimeSeconds in content: ${elapsedTimeInSeconds} seconds`
//               );
//             }
//             // Also look for it in nested structures
//             else if (
//               content.reportInfo &&
//               content.reportInfo.elapsedTimeSeconds
//             ) {
//               elapsedTimeInSeconds = content.reportInfo.elapsedTimeSeconds;
//
//                 `Found elapsedTimeSeconds in reportInfo: ${elapsedTimeInSeconds} seconds`
//               );
//             }
//             // Try other possible locations
//             else if (content.metadata && content.metadata.elapsedTimeSeconds) {
//               elapsedTimeInSeconds = content.metadata.elapsedTimeSeconds;
//
//                 `Found elapsedTimeSeconds in metadata: ${elapsedTimeInSeconds} seconds`
//               );
//             }
//           }

//           // Convert seconds to minutes for storage, with minimum of 1 minute
//           const reportTimeInMinutes = Math.max(
//             1,
//             Math.round(elapsedTimeInSeconds / 60)
//           );
//
//             `Converting ${elapsedTimeInSeconds} seconds to ${reportTimeInMinutes} minutes for report_time`
//           );

//           // Track the performance with the actual elapsed time
//           await trackUserPerformance({
//             client_id: clientResult[0].id, // Use numeric client ID
//             user_id: user_id,
//             report_id: result.insertId,
//             report_name: template_name,
//             report_time: reportTimeInMinutes, // Pass the elapsed time in minutes
//             creation_timestamp: reportCreationTime, // Pass the creation timestamp
//             elapsed_seconds: elapsedTimeInSeconds, // Pass the original seconds value
//             status: reportStatus,
//             score: null, // Score will be added later when implemented
//           });
//         } catch (perfError) {
//           // Non-blocking - log but don't fail the request
//           console.error("Error tracking user performance:", perfError);
//         }

//         return res.status(201).json({
//           success: true,
//           message: `Report saved successfully to ${clientReportsTable}`,
//           data: {
//             id: result.insertId,
//             table: clientReportsTable,
//             primary_field: {
//               name: primaryFieldName,
//               value: primaryFieldValue,
//             },
//             date: content?.date,
//             timestamp_url: timestamp_url,
//           },
//         });
//       }
//     } finally {
//       connection.release();
//     }
//   } catch (error) {
//     console.error("Error saving report:", error);
//     return res.status(500).json({
//       error: "Failed to save report",
//       details: error.message,
//     });
//   }
// };

// const saveReport = async (req, res) => {
//   try {
//     const {
//       client_id,
//       template_name,
//       colors,
//       content,
//       status,
//       user_id: requestUserId,
//       id: bodyId,
//       table,
//       media_links,
//       visits_add,
//     } = req.body;

//     const reportId = req.params.id || bodyId;
//     const isUpdate = !!reportId;
//     const user_id = requestUserId || req.user?.id || null;
//     const reportStatus = status || "draft";
//     const tableFromQuery = req.query.table;
//     const clientReportsTableOverride = tableFromQuery || table;

//     const connection = await db.getConnection();
//     try {
//       let normalizedClientId = client_id;
//       if (typeof client_id === "string" && client_id.includes("-")) {
//         normalizedClientId = client_id;
//       }

//       const [clientResult] = await connection.query(
//         "SELECT id, name FROM clients WHERE id = ?",
//         [normalizedClientId]
//       );

//       if (clientResult.length === 0) {
//         const [altClientResult] = await connection.query(
//           "SELECT id, name FROM clients WHERE uuid = ?",
//           [client_id]
//         );
//         if (altClientResult.length === 0) {
//           return res
//             .status(404)
//             .json({ error: "Client not found. Tried with ID: " + client_id });
//         }
//         clientResult[0] = altClientResult[0];
//       }

//       const clientName = clientResult[0].name
//         .replace(/\s+/g, "_")
//         .replace(/[^a-zA-Z0-9_]/g, "")
//         .toLowerCase();

//       const clientReportsTable =
//         clientReportsTableOverride || `${clientName}_reports`;

//       let primaryFieldName = "branch_code";
//       let primaryFieldValue = null;

//       if (content?.primaryField) {
//         primaryFieldName = content.primaryField.name;
//         primaryFieldValue = content.primaryField.value;
//       } else if (
//         content?.primaryIdentifierField &&
//         content?.selectedFieldValues
//       ) {
//         primaryFieldName = content.primaryIdentifierField;
//         const primaryFieldObj = content.selectedFieldValues[primaryFieldName];
//         if (primaryFieldObj) {
//           if (typeof primaryFieldObj === "object") {
//             primaryFieldValue = primaryFieldObj.value || primaryFieldObj.name;
//           } else {
//             primaryFieldValue = primaryFieldObj;
//           }
//         }
//       }

//       // ✅ Handle visits_add
//       if (visits_add === true && primaryFieldValue) {
//         const [tableCheck] = await connection.query(
//           "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
//           [clientReportsTable]
//         );

//         if (tableCheck[0].count > 0) {
//           const [existingVisits] = await connection.query(
//             `SELECT primary_field_value FROM ${clientReportsTable}
//              WHERE primary_field_name = ? AND primary_field_value LIKE ?`,
//             [primaryFieldName, `${primaryFieldValue}-visit-%`]
//           );

//           let maxVisitNumber = 0;
//           existingVisits.forEach((report) => {
//             const match = report.primary_field_value.match(/-visit-(\d+)$/);
//             if (match && match[1]) {
//               const visitNumber = parseInt(match[1], 10);
//               if (!isNaN(visitNumber) && visitNumber > maxVisitNumber) {
//                 maxVisitNumber = visitNumber;
//               }
//             }
//           });

//           primaryFieldValue = `${primaryFieldValue}-visit-${
//             maxVisitNumber + 1
//           }`;
//         } else {
//           primaryFieldValue = `${primaryFieldValue}-visit-1`;
//         }
//       }

//       // ✅ Extract date from content
//       const reportDateStr = content?.date;
//       const reportDate = reportDateStr ? new Date(reportDateStr) : new Date();

//       // ✅ Check for same-name reports (not by created_at but by content.date)
//       const [existingSameNameReports] = await connection.query(
//         `SELECT id, content, primary_field_value
//          FROM ${clientReportsTable}
//          WHERE client_id = ? AND template_name = ?`,
//         [client_id, template_name]
//       );

//       let shouldAddSuffix = false;
//       let basePrimaryValue = primaryFieldValue;
//       let maxSuffix = 0;

//       existingSameNameReports.forEach((report) => {
//         let existingContent = {};
//         try {
//           existingContent =
//             typeof report.content === "string"
//               ? JSON.parse(report.content)
//               : report.content;
//         } catch (_) {}

//         const existingDate = existingContent?.date
//           ? new Date(existingContent.date)
//           : null;

//         if (
//           existingDate &&
//           reportDate.getFullYear() === existingDate.getFullYear() &&
//           reportDate.getMonth() === existingDate.getMonth()
//         ) {
//           shouldAddSuffix = true;

//           const match = report.primary_field_value?.match(/-(\d+)$/);
//           if (match && match[1]) {
//             const suffix = parseInt(match[1]);
//             if (!isNaN(suffix) && suffix > maxSuffix) {
//               maxSuffix = suffix;
//             }
//           } else if (report.primary_field_value === basePrimaryValue) {
//             if (maxSuffix === 0) maxSuffix = 1;
//           }
//         }
//       });

//       if (shouldAddSuffix) {
//         primaryFieldValue = `${basePrimaryValue}-${maxSuffix + 1}`;

//         if (content?.primaryField) {
//           content.primaryField.value = primaryFieldValue;
//         } else if (
//           content?.selectedFieldValues &&
//           content?.primaryIdentifierField
//         ) {
//           const fieldName = content.primaryIdentifierField;
//           if (typeof content.selectedFieldValues[fieldName] === "object") {
//             content.selectedFieldValues[fieldName].value = primaryFieldValue;
//           } else {
//             content.selectedFieldValues[fieldName] = primaryFieldValue;
//           }
//         }
//       }

//       // ✅ Insert Report
//       const timestamp_url = req.body.timestamp_url || null;

//       const [result] = await connection.query(
//         `INSERT INTO ${clientReportsTable}
//          (client_id, template_name, primary_field_name, primary_field_value, colors, content, status, created_by, updated_by, video_url, audio_url, images_urls, timestamp_url)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           client_id,
//           template_name,
//           primaryFieldName,
//           primaryFieldValue,
//           JSON.stringify(colors || {}),
//           JSON.stringify(content || {}),
//           reportStatus,
//           user_id,
//           user_id,
//           media_links?.video_link || null,
//           media_links?.audio_link || null,
//           media_links?.image_link
//             ? JSON.stringify([media_links.image_link])
//             : null,
//           timestamp_url,
//         ]
//       );

//       // ✅ Track Performance
//       try {
//         const reportCreationTime = new Date();
//         let elapsedTimeInSeconds = 0;

//         if (content?.timerInfo?.elapsedTimeSeconds) {
//           elapsedTimeInSeconds = content.timerInfo.elapsedTimeSeconds;
//         } else if (content?.elapsedTimeSeconds) {
//           elapsedTimeInSeconds = content.elapsedTimeSeconds;
//         } else if (content?.reportInfo?.elapsedTimeSeconds) {
//           elapsedTimeInSeconds = content.reportInfo.elapsedTimeSeconds;
//         } else if (content?.metadata?.elapsedTimeSeconds) {
//           elapsedTimeInSeconds = content.metadata.elapsedTimeSeconds;
//         }

//         const reportTimeInMinutes = Math.max(
//           1,
//           Math.round(elapsedTimeInSeconds / 60)
//         );

//         await trackUserPerformance({
//           client_id: clientResult[0].id,
//           user_id,
//           report_id: result.insertId,
//           report_name: template_name,
//           report_time: reportTimeInMinutes,
//           creation_timestamp: reportCreationTime,
//           elapsed_seconds: elapsedTimeInSeconds,
//           status: reportStatus,
//           score: null,
//         });
//       } catch (perfError) {
//         console.error("Error tracking user performance:", perfError);
//       }

//       return res.status(201).json({
//         success: true,
//         message: `Report saved successfully to ${clientReportsTable}`,
//         data: {
//           id: result.insertId,
//           table: clientReportsTable,
//           primary_field: {
//             name: primaryFieldName,
//             value: primaryFieldValue,
//           },
//           date: content?.date,
//           timestamp_url: timestamp_url,
//         },
//       });
//     } finally {
//       connection.release();
//     }
//   } catch (error) {
//     console.error("Error saving report:", error);
//     return res.status(500).json({
//       error: "Failed to save report",
//       details: error.message,
//     });
//   }
// };

// ✅ Helper to ensure reports table exists
async function ensureClientReportsTable(connection, tableName) {
  const [tableCheck] = await connection.query(
    "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [tableName],
  );

  if (tableCheck[0].count === 0) {
    await connection.query(`
      CREATE TABLE \`${tableName}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id VARCHAR(255) NOT NULL,
        template_name VARCHAR(255) NOT NULL,
        primary_field_name VARCHAR(255),
        primary_field_value VARCHAR(255),
        colors JSON,
        content JSON,
        status VARCHAR(50),
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        video_url TEXT,
        audio_url TEXT,
        images_urls JSON,
        timestamp_url TEXT,
        pdf_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_client_id (client_id),
        INDEX idx_primary_field_value (primary_field_value)
      )
    `);
  }
}

const saveReport = async (req, res) => {
  try {
    let {
      client_id,
      template_name,
      colors,
      content,
      status,
      user_id: requestUserId,
      id: bodyId, // Allow ID to be passed in the body for updates
      table, // Allow table to be specified in the body
      media_links, // Extract media links from request
      visits_add, // Extract the visits_add flag from request body
    } = req.body;

    // Check if this is an update request (PUT) by checking for ID in URL params or body
    const reportId = req.params.id || bodyId;
    const isUpdate = !!reportId;

    // Use user_id from request payload if provided, otherwise fall back to JWT token
    const user_id = requestUserId || req.user?.id || null;

    if (!client_id || !template_name) {
      return res.status(400).json({
        error: "Client ID and template name are required",
      });
    }

    // Default status to 'draft' if not provided
    const reportStatus = status || "draft";

    // If updating and table is provided in the query, use it
    const tableFromQuery = req.query.table;
    const clientReportsTableOverride = tableFromQuery || table;

    // Get a connection from the pool
    const connection = await db.getConnection();

    try {
      // First, get the client name for the table name

      // Try to normalize UUID format if needed
      let normalizedClientId = client_id;
      if (typeof client_id === "string" && client_id.includes("-")) {
        // Keep UUID format as is for lookup
        normalizedClientId = client_id;
      }

      const [clientResult] = await connection.query(
        "SELECT id, name FROM clients WHERE id = ?",
        [normalizedClientId],
      );

      if (clientResult.length === 0) {
        // Try alternative lookup if using UUID string

        const [altClientResult] = await connection.query(
          "SELECT id, name FROM clients WHERE uuid = ?",
          [client_id],
        );

        if (altClientResult.length === 0) {
          return res.status(404).json({
            error: "Client not found. Tried with ID: " + client_id,
          });
        }

        // Use client from alternative lookup
        clientResult[0] = altClientResult[0];
      }

      // Format client name to be used in table name (remove spaces, special chars)
      const clientName = clientResult[0].name
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9_]/g, "") // Remove special characters
        .toLowerCase();

      // Define the client-specific reports table name
      // If directly updating with a specific table, use that instead
      const clientReportsTable =
        clientReportsTableOverride || `${clientName}_reports`;

      // Extract primary field information from the content
      let primaryFieldName = "branch_code"; // Default to branch_code
      let primaryFieldValue = null;

      // Check if content has a specific primaryField object (new format)
      if (content && typeof content === "object" && content.primaryField) {
        primaryFieldName = content.primaryField.name;
        primaryFieldValue = content.primaryField.value;
      }
      // Fallback to the old method if primaryField is not directly available
      else if (
        content &&
        typeof content === "object" &&
        content.primaryIdentifierField &&
        content.selectedFieldValues
      ) {
        primaryFieldName = content.primaryIdentifierField;

        // Get the value for the primary field
        const primaryFieldObj = content.selectedFieldValues[primaryFieldName];
        if (primaryFieldObj) {
          // If it's an object with value property (from dropdown)
          if (typeof primaryFieldObj === "object" && primaryFieldObj.value) {
            primaryFieldValue = primaryFieldObj.value;
          } else if (
            typeof primaryFieldObj === "object" &&
            primaryFieldObj.name
          ) {
            primaryFieldValue = primaryFieldObj.name;
          } else {
            primaryFieldValue = primaryFieldObj;
          }
        }
      } else {
      }

      // Handle the visits_add flag for visit numbering
      // If visits_add is true, add a visit number suffix to the primary field value
      if (visits_add === true && primaryFieldValue) {
        // Check if table exists before querying
        const [tableCheck] = await connection.query(
          "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
          [clientReportsTable],
        );

        // Only proceed with visit numbering if the table exists
        if (tableCheck[0].count > 0) {
          // Query existing reports with the same primary field value pattern
          const [existingVisits] = await connection.query(
            `SELECT primary_field_value FROM ${clientReportsTable} 
             WHERE primary_field_name = ? AND primary_field_value LIKE ?`,
            [primaryFieldName, `${primaryFieldValue}-visit-%`],
          );

          // Find the highest visit number
          let maxVisitNumber = 0;
          existingVisits.forEach((report) => {
            const match = report.primary_field_value.match(/-visit-(\d+)$/);
            if (match && match[1]) {
              const visitNumber = parseInt(match[1], 10);
              if (!isNaN(visitNumber) && visitNumber > maxVisitNumber) {
                maxVisitNumber = visitNumber;
              }
            }
          });

          // Append visit number to primary field value
          primaryFieldValue = `${primaryFieldValue}-visit-${
            maxVisitNumber + 1
          }`;
        } else {
          // If table doesn't exist yet, this is the first report, so use visit-1
          primaryFieldValue = `${primaryFieldValue}-visit-1`;
        }
      }

      // If this is a direct update to a specific report ID (PUT request)
      if (isUpdate && reportId) {
        // Ensure the table exists first
        await ensureClientReportsTable(connection, clientReportsTable);

        // Check if the report exists in the table
        const [reportExists] = await connection.query(
          `SELECT id FROM ${clientReportsTable} WHERE id = ?`,
          [reportId],
        );

        if (reportExists.length === 0) {
          return res.status(404).json({
            error: `Report with ID ${reportId} not found in table ${clientReportsTable}`,
          });
        }

        // Update the existing report

        // IMPORTANT: For updates, check if changing primary field would create duplicate
        // BUT only reject if the duplicate is in the SAME MONTH (same logic as CREATE)
        if (primaryFieldValue) {
          const [existingWithSameField] = await connection.query(
            `SELECT id, primary_field_value, template_name, content, created_at FROM ${clientReportsTable}
             WHERE client_id = ? AND primary_field_value = ? AND template_name = ? AND id != ?`,
            [client_id, primaryFieldValue, template_name, reportId],
          );

          if (existingWithSameField.length > 0) {
            // Extract date from the current report being updated
            const currentReportDate = content?.date
              ? new Date(content.date)
              : new Date();

            // Check if the existing report is in the same month
            const existingReport = existingWithSameField[0];
            let existingReportDate;

            try {
              const existingContent =
                typeof existingReport.content === "string"
                  ? JSON.parse(existingReport.content)
                  : existingReport.content;
              existingReportDate = existingContent?.date
                ? new Date(existingContent.date)
                : new Date(existingReport.created_at);
            } catch (e) {
              existingReportDate = new Date(existingReport.created_at);
            }

            // Only reject if reports are in the SAME MONTH
            const isSameMonth =
              existingReportDate.getFullYear() ===
                currentReportDate.getFullYear() &&
              existingReportDate.getMonth() === currentReportDate.getMonth();

            if (isSameMonth) {
              return res.status(409).json({
                success: false,
                error:
                  "Cannot update: A report with this template name and branch already exists for this month",
                message: `Report "${template_name}" already exists for branch (${primaryFieldValue}) in the same month. ID: ${existingWithSameField[0].id}`,
                duplicate_detected: true,
                existing_report_id: existingWithSameField[0].id,
              });
            } else {
              // Different month - allow the update
            }
          }
        }

        // Extract timestamp_url and pdf_url from the request for updates
        const timestamp_url = req.body.timestamp_url || null;
        const pdf_url =
          media_links?.pdf_link ||
          media_links?.pdf_url ||
          req.body.pdf_url ||
          null;

        await connection.query(
          `UPDATE ${clientReportsTable}
           SET primary_field_name = ?, primary_field_value = ?, colors = ?, content = ?, status = ?, updated_by = ?, updated_at = NOW(), template_name = ?,
           video_url = ?, audio_url = ?, images_urls = ?, timestamp_url = ?, pdf_url = ?
           WHERE id = ?`,
          [
            primaryFieldName,
            primaryFieldValue,
            JSON.stringify(colors || {}),
            JSON.stringify(content || {}),
            reportStatus,
            user_id,
            template_name,
            media_links?.video_link || media_links?.video_url || null,
            media_links?.audio_link || media_links?.audio_url || null,
            media_links?.image_link
              ? JSON.stringify([media_links.image_link])
              : media_links?.images_urls
                ? JSON.stringify(media_links.images_urls)
                : null,
            timestamp_url,
            pdf_url,
            reportId,
          ],
        );

        // Track user performance for updates
        try {
          // Get the report start time - either from the existing record or use a default (30 mins ago)
          let reportStartTime = new Date();
          reportStartTime.setMinutes(reportStartTime.getMinutes() - 30); // Default 30 mins ago

          // For updates, try to get the previous update time
          const [existingReport] = await connection.query(
            `SELECT updated_at, created_at FROM ${clientReportsTable} WHERE id = ?`,
            [reportId],
          );

          if (existingReport.length > 0) {
            reportStartTime =
              existingReport[0].updated_at || existingReport[0].created_at;
          }

          // Try to extract elapsed time from content
          let elapsedTimeInSeconds = 0;

          if (content && typeof content === "object") {
            // Try to extract elapsedTimeSeconds from timerInfo first (new format)
            if (content.timerInfo && content.timerInfo.elapsedTimeSeconds) {
              elapsedTimeInSeconds = content.timerInfo.elapsedTimeSeconds;
            }
            // Try to extract elapsedTimeSeconds directly
            else if (content.elapsedTimeSeconds) {
              elapsedTimeInSeconds = content.elapsedTimeSeconds;
            }
            // Also look for it in nested structures
            else if (
              content.reportInfo &&
              content.reportInfo.elapsedTimeSeconds
            ) {
              elapsedTimeInSeconds = content.reportInfo.elapsedTimeSeconds;
            }
            // Try other possible locations
            else if (content.metadata && content.metadata.elapsedTimeSeconds) {
              elapsedTimeInSeconds = content.metadata.elapsedTimeSeconds;
            }
          }

          let reportTime;
          // If we found elapsed time in seconds in the content, use that
          if (elapsedTimeInSeconds > 0) {
            // Convert seconds to minutes for storage, with minimum of 1 minute
            reportTime = Math.max(1, Math.round(elapsedTimeInSeconds / 60));
          } else {
            // Fall back to calculated time based on timestamps
            reportTime = calculateReportTime(reportStartTime, new Date());
          }

          // Get the current timestamp
          const reportCreationTime = new Date();

          // Track the performance
          await trackUserPerformance({
            client_id: clientResult[0].id, // Use numeric client ID
            user_id: user_id,
            report_id: reportId,
            report_name: template_name,
            report_time: reportTime,
            creation_timestamp: reportCreationTime,
            elapsed_seconds: elapsedTimeInSeconds,
            status: reportStatus,
            score: null, // Score will be added later when implemented
          });
        } catch (perfError) {
          // Non-blocking - log but don't fail the request
          console.error("Error tracking user performance:", perfError);
        }

        return res.status(200).json({
          success: true,
          message: `Report with ID ${reportId} updated successfully in ${clientReportsTable}`,
          data: {
            id: reportId,
            table: clientReportsTable,
            primary_field: {
              name: primaryFieldName,
              value: primaryFieldValue,
            },
            timestamp_url: req.body.timestamp_url || null,
          },
        });
      }

      // Continue with normal flow for new reports...
      // Extract date from content for duplicate checking - use original content, not modified
      const originalContent = req.body.content; // Use the original request content
      const reportDateStr = originalContent?.date;
      const reportDate = reportDateStr ? new Date(reportDateStr) : new Date();

      // Ensure the reports table exists before checking for duplicates
      await ensureClientReportsTable(connection, clientReportsTable);

      // Check for existing reports with the same primary field value - WITH LOCK to prevent race conditions
      if (primaryFieldValue) {
        // LOCK the table temporarily to prevent race conditions during duplicate checking
        await connection.query(`LOCK TABLES ${clientReportsTable} WRITE`);

        try {
          // Get all reports with the same primary field name and value (or similar with -1, -2 suffixes)
          // INCLUDE content and created_at to check dates
          const [similarReports] = await connection.query(
            `SELECT primary_field_value, template_name, content, created_at FROM ${clientReportsTable}
             WHERE client_id = ? AND primary_field_name = ? AND (primary_field_value = ? OR primary_field_value LIKE ?)`,
            [
              client_id,
              primaryFieldName,
              primaryFieldValue,
              `${primaryFieldValue}-%`,
            ],
          );

          // If there are similar reports, check if they are in the same month before adding suffix
          if (similarReports.length > 0) {
            // Check for exact template name match to prevent complete duplicates
            // But only reject if it's in the same month
            const exactTemplateMatch = similarReports.find(
              (report) =>
                report.template_name === template_name &&
                report.primary_field_value === primaryFieldValue,
            );

            if (exactTemplateMatch) {
              // Check if the existing report is from the same month
              let existingReportDate;

              // Try to extract date from content first
              try {
                const existingContent =
                  typeof exactTemplateMatch.content === "string"
                    ? JSON.parse(exactTemplateMatch.content)
                    : exactTemplateMatch.content;
                existingReportDate = existingContent?.date
                  ? new Date(existingContent.date)
                  : new Date(exactTemplateMatch.created_at);
              } catch (e) {
                // If parsing fails, use created_at
                existingReportDate = new Date(exactTemplateMatch.created_at);
              }

              // Get the new report's date (already extracted earlier in the code)
              const newReportDate = reportDate;

              // Check if they are in the same month and year
              const isSameMonth =
                existingReportDate.getFullYear() ===
                  newReportDate.getFullYear() &&
                existingReportDate.getMonth() === newReportDate.getMonth();

              if (isSameMonth) {
                // This is a duplicate in the same month - reject it
                await connection.query(`UNLOCK TABLES`);
                return res.status(409).json({
                  success: false,
                  error:
                    "A report with this template name and branch already exists for this month",
                  message: `Report "${template_name}" already exists for this branch (${primaryFieldValue}) in the same month`,
                  duplicate_detected: true,
                });
              } else {
                // Different month - allow it but log it
              }
            }

            // Now check if we need to add suffix - ONLY if the EXACT value exists in the SAME MONTH
            let maxSuffix = 0;
            let basePrimaryValue = primaryFieldValue;
            let exactMatchInSameMonth = false;

            // Filter similar reports to only those in the same month
            similarReports.forEach((report) => {
              let existingReportDate;

              // Try to extract date from content first
              try {
                const existingContent =
                  typeof report.content === "string"
                    ? JSON.parse(report.content)
                    : report.content;
                existingReportDate = existingContent?.date
                  ? new Date(existingContent.date)
                  : new Date(report.created_at);
              } catch (e) {
                // If parsing fails, use created_at
                existingReportDate = new Date(report.created_at);
              }

              // Check if this report is in the same month as the new report
              const isSameMonth =
                existingReportDate.getFullYear() === reportDate.getFullYear() &&
                existingReportDate.getMonth() === reportDate.getMonth();

              // Only process reports that are in the SAME MONTH
              if (isSameMonth) {
                // Check if this exact value already exists (without suffix) in the same month
                if (report.primary_field_value === primaryFieldValue) {
                  exactMatchInSameMonth = true; // Mark that we need a suffix
                }

                // Track the highest suffix number for reports with the same base value
                // This includes both exact match AND suffixed versions in the same month
                if (report.primary_field_value === primaryFieldValue) {
                  // Exact match found, start suffixes from -1
                  if (maxSuffix === 0) maxSuffix = 0; // Will become 1 when we add 1
                } else if (report.primary_field_value.includes("-")) {
                  // Handle values with dash and number suffix like "ABC-1", "ABC-2"
                  const parts = report.primary_field_value.split("-");
                  const lastPart = parts[parts.length - 1];
                  const suffix = parseInt(lastPart);

                  // If the base value matches and the suffix is a number
                  if (
                    !isNaN(suffix) &&
                    report.primary_field_value.startsWith(
                      `${basePrimaryValue}-`,
                    )
                  ) {
                    if (suffix > maxSuffix) {
                      maxSuffix = suffix;
                    }
                  }
                }
              }
            });

            // ONLY add suffix if the EXACT primary_field_value already exists in the same month
            if (exactMatchInSameMonth) {
              primaryFieldValue = `${basePrimaryValue}-${maxSuffix + 1}`;

              // ⚠️ CRITICAL: Create a DEEP COPY of content to avoid modifying the original request data

              const originalPrimaryValue =
                content?.primaryField?.value || "undefined";
              let modifiedContent = JSON.parse(JSON.stringify(content || {}));

              // Update the COPIED content object to reflect the new primary field value
              if (modifiedContent && typeof modifiedContent === "object") {
                if (modifiedContent.primaryField) {
                  modifiedContent.primaryField.value = primaryFieldValue;
                } else if (
                  modifiedContent.selectedFieldValues &&
                  modifiedContent.primaryIdentifierField
                ) {
                  // Update in the old format as well if needed
                  const fieldName = modifiedContent.primaryIdentifierField;
                  if (modifiedContent.selectedFieldValues[fieldName]) {
                    if (
                      typeof modifiedContent.selectedFieldValues[fieldName] ===
                      "object"
                    ) {
                      modifiedContent.selectedFieldValues[fieldName].value =
                        primaryFieldValue;
                    } else {
                      modifiedContent.selectedFieldValues[fieldName] =
                        primaryFieldValue;
                    }
                  }
                }
              }

              // Use the modified content for database insertion

              content = modifiedContent;
            } else {
              // No reports in the same month - allow exact primary_field_value
            }
          }
        } finally {
          // Always unlock the table
          await connection.query(`UNLOCK TABLES`);
        }
      }

      // REMOVED: Redundant duplicate check - the primary_field_value check above (lines 1459-1650)
      // already handles month-based suffix logic correctly. This second check was causing
      // incorrect suffixes to be added even when reports were from different months.
      //
      // The first check (lines 1459-1650) properly:
      // 1. Checks if reports with same primary_field_value exist
      // 2. Verifies if they are in the same month
      // 3. Only adds suffix if reports are in the SAME month
      // 4. Allows exact primary_field_value if reports are in DIFFERENT months

      // Always create a new report (with incremented suffix if needed)

      // CRITICAL: Ensure we're creating a NEW report, not updating an existing one
      if (isUpdate) {
        return res.status(500).json({
          success: false,
          error: "Internal error: Update flag set for new report creation",
          message: "System error detected. Please contact support.",
        });
      }

      // Extract timestamp_url and pdf_url from the request
      const timestamp_url = req.body.timestamp_url || null;
      const pdf_url =
        media_links?.pdf_link ||
        media_links?.pdf_url ||
        req.body.pdf_url ||
        null;

      const [result] = await connection.query(
        `INSERT INTO ${clientReportsTable} 
         (client_id, template_name, primary_field_name, primary_field_value, colors, content, status, created_by, updated_by, video_url, audio_url, images_urls, timestamp_url, pdf_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          client_id,
          template_name,
          primaryFieldName,
          primaryFieldValue,
          JSON.stringify(colors || {}),
          JSON.stringify(content || {}),
          reportStatus,
          user_id,
          user_id,
          media_links?.video_link || media_links?.video_url || null,
          media_links?.audio_link || media_links?.audio_url || null,
          media_links?.image_link
            ? JSON.stringify([media_links.image_link])
            : media_links?.images_urls
              ? JSON.stringify(media_links.images_urls)
              : null,
          timestamp_url,
          pdf_url,
        ],
      );

      // Track user performance for new reports
      try {
        // For new reports, use the actual creation timestamp
        const reportCreationTime = new Date(); // Current time when report is created

        // Try to extract elapsed time from content
        let elapsedTimeInSeconds = 0;

        if (content && typeof content === "object") {
          // Try to extract elapsedTimeSeconds from timerInfo first (new format)
          if (content.timerInfo && content.timerInfo.elapsedTimeSeconds) {
            elapsedTimeInSeconds = content.timerInfo.elapsedTimeSeconds;
          }
          // Try to extract elapsedTimeSeconds directly
          else if (content.elapsedTimeSeconds) {
            elapsedTimeInSeconds = content.elapsedTimeSeconds;
          }
          // Also look for it in nested structures
          else if (
            content.reportInfo &&
            content.reportInfo.elapsedTimeSeconds
          ) {
            elapsedTimeInSeconds = content.reportInfo.elapsedTimeSeconds;
          }
          // Try other possible locations
          else if (content.metadata && content.metadata.elapsedTimeSeconds) {
            elapsedTimeInSeconds = content.metadata.elapsedTimeSeconds;
          }
        }

        // Convert seconds to minutes for storage, with minimum of 1 minute
        const reportTimeInMinutes = Math.max(
          1,
          Math.round(elapsedTimeInSeconds / 60),
        );

        // Track the performance with the actual elapsed time
        await trackUserPerformance({
          client_id: clientResult[0].id, // Use numeric client ID
          user_id: user_id,
          report_id: result.insertId,
          report_name: template_name,
          report_time: reportTimeInMinutes, // Pass the elapsed time in minutes
          creation_timestamp: reportCreationTime, // Pass the creation timestamp
          elapsed_seconds: elapsedTimeInSeconds, // Pass the original seconds value
          status: reportStatus,
          score: null, // Score will be added later when implemented
        });
      } catch (perfError) {
        // Non-blocking - log but don't fail the request
        console.error("Error tracking user performance:", perfError);
      }

      return res.status(201).json({
        success: true,
        message: `Report saved successfully to ${clientReportsTable}`,
        data: {
          id: result.insertId,
          table: clientReportsTable,
          primary_field: {
            name: primaryFieldName,
            value: primaryFieldValue,
          },
          date: content?.date,
          timestamp_url: timestamp_url,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error saving report:", error);
    return res.status(500).json({
      error: "Failed to save report",
      details: error.message,
    });
  }
};

const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_id,
      user_id,
      media_links,
      video_url,
      audio_url,
      images_urls,
      colors,
      content,
      status,
      template_name,
      timestamp_url,
    } = req.body;

    if (!client_id || !id) {
      return res
        .status(400)
        .json({ error: "Client ID and Report ID are required" });
    }

    const connection = await db.getConnection();

    try {
      // Get client name for table resolution
      const [clientResult] = await connection.query(
        "SELECT name FROM clients WHERE id = ? OR uuid = ?",
        [client_id, client_id],
      );

      if (clientResult.length === 0) {
        return res.status(404).json({ error: "Client not found" });
      }

      const clientName = clientResult[0].name
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();

      const clientReportsTable = `${clientName}_reports`;

      // Check if the report exists before updating
      const [reportExists] = await connection.query(
        `SELECT id, primary_field_value, template_name FROM ${clientReportsTable} WHERE id = ?`,
        [id],
      );

      if (reportExists.length === 0) {
        return res.status(404).json({
          error: `Report with ID ${id} not found in table ${clientReportsTable}`,
        });
      }

      // Extract primary field information from the content (same logic as saveReport)
      let primaryFieldName = "branch_code"; // Default to branch_code
      let primaryFieldValue = null;

      // Check if content has a specific primaryField object (new format)
      if (content && typeof content === "object" && content.primaryField) {
        primaryFieldName = content.primaryField.name;
        primaryFieldValue = content.primaryField.value;
      }
      // Fallback to the old method if primaryField is not directly available
      else if (
        content &&
        typeof content === "object" &&
        content.primaryIdentifierField &&
        content.selectedFieldValues
      ) {
        primaryFieldName = content.primaryIdentifierField;

        // Get the value for the primary field
        const primaryFieldObj = content.selectedFieldValues[primaryFieldName];
        if (primaryFieldObj) {
          // If it's an object with value property (from dropdown)
          if (typeof primaryFieldObj === "object" && primaryFieldObj.value) {
            primaryFieldValue = primaryFieldObj.value;
          } else if (
            typeof primaryFieldObj === "object" &&
            primaryFieldObj.name
          ) {
            primaryFieldValue = primaryFieldObj.name;
          } else {
            primaryFieldValue = primaryFieldObj;
          }
        }
      }

      // IMPORTANT: Check if changing primary field would create duplicate
      if (primaryFieldValue) {
        // Get the current report's primary field value to compare
        const currentReport = reportExists[0];
        const currentPrimaryFieldValue = currentReport.primary_field_value;

        // Only check for duplicates if the primary field value is actually changing
        if (currentPrimaryFieldValue !== primaryFieldValue) {
          const [existingWithSameField] = await connection.query(
            `SELECT id, primary_field_value, template_name FROM ${clientReportsTable}
             WHERE client_id = ? AND primary_field_value = ? AND template_name = ? AND id != ?`,
            [client_id, primaryFieldValue, template_name, id],
          );

          if (existingWithSameField.length > 0) {
          }
        } else {
        }
      }

      // Fallback if media_links not sent as object
      const finalVideoUrl = media_links?.video_url || video_url || null;
      const finalAudioUrl = media_links?.audio_url || audio_url || null;
      const finalImagesUrls = media_links?.images_urls || images_urls || [];
      const finalPdfUrl = media_links?.pdf_url || req.body.pdf_url || null;

      const serializedImages = Array.isArray(finalImagesUrls)
        ? JSON.stringify(finalImagesUrls)
        : finalImagesUrls;

      const serializedColors =
        typeof colors === "object" ? JSON.stringify(colors) : colors;
      const serializedContent =
        typeof content === "object" ? JSON.stringify(content) : content;

      const [result] = await connection.query(
        `UPDATE ${clientReportsTable}
         SET 
           primary_field_name = ?,
           primary_field_value = ?,
           video_url = ?, 
           audio_url = ?, 
           images_urls = ?, 
           colors = ?, 
           content = ?, 
           updated_by = ?, 
           updated_at = CURRENT_TIMESTAMP,
           status = ?,
           template_name = ?,
           timestamp_url = ?,
           pdf_url = ?
         WHERE id = ?`,
        [
          primaryFieldName,
          primaryFieldValue,
          finalVideoUrl,
          finalAudioUrl,
          serializedImages,
          serializedColors,
          serializedContent,
          user_id,
          status,
          template_name,
          timestamp_url,
          finalPdfUrl,
          id,
        ],
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "Report not found or not updated" });
      }

      return res.status(200).json({
        success: true,
        message: "Report updated successfully",
        data: {
          id: id,
          table: clientReportsTable,
          primary_field: {
            name: primaryFieldName,
            value: primaryFieldValue,
          },
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating report:", error);
    return res
      .status(500)
      .json({ error: "Failed to update report", details: error.message });
  }
};

/**
 * Fetch reports for a client
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getReports = async (req, res) => {
  try {
    const { client_id } = req.params;
    const { user_id, user_email, user_role } = req.query; // Get user_id, user_email and user_role from query params

    if (!client_id) {
      return res.status(400).json({
        error: "Client ID is required",
      });
    }

    const connection = await db.getConnection();

    try {
      // First, get the client name for the table name - try by both id and uuid

      // First try with id
      let [clientResult] = await connection.query(
        "SELECT name, domain_name FROM clients WHERE id = ?",
        [client_id],
      );

      // If not found, try with uuid
      if (clientResult.length === 0) {
        [clientResult] = await connection.query(
          "SELECT name, domain_name FROM clients WHERE uuid = ?",
          [client_id],
        );

        // If still not found, return 404
        if (clientResult.length === 0) {
          return res.status(404).json({
            error: "Client not found",
          });
        }
      }

      // Store client information including domain_name
      const clientInfo = {
        name: clientResult[0].name,
        domain_name: clientResult[0].domain_name || null,
      };

      // Format client name to be used in table name
      const clientName = clientInfo.name
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();

      // Define the client-specific reports table name
      const clientReportsTable = `${clientName}_reports`;

      // Define the client-specific branches table name
      const clientBranchesTable = `${clientName}_branches`;

      // Check if the client-specific reports table exists
      const [reportsTableExists] = await connection.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
        [clientReportsTable],
      );

      // If table doesn't exist yet, return empty array
      if (reportsTableExists[0].count === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "No reports table exists for this client yet",
          client_info: clientInfo,
        });
      }

      // Check if the client-specific branches table exists
      const [branchesTableExists] = await connection.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
        [clientBranchesTable],
      );

      // Check if the table has the new dynamic primary field columns
      const [columnsCheck] = await connection.query(
        `
        SELECT 
          COUNT(*) as count 
        FROM information_schema.columns 
        WHERE 
          table_schema = DATABASE() 
          AND table_name = ? 
          AND column_name IN ('primary_field_name', 'primary_field_value')
      `,
        [clientReportsTable],
      );

      // Build WHERE clause and params array based on filters
      let whereClause = "r.client_id = ?";
      let queryParams = [client_id];

      // Add user_id filter if provided
      if (user_id) {
        whereClause += " AND r.created_by = ?";
        queryParams.push(user_id);
      }

      // Special handling for client_user role - they should only see reports for their assigned branches
      let allowedReportIds = null;
      const isClientUser = user_role === "client_user";

      if (isClientUser && user_email && branchesTableExists[0].count > 0) {
        try {
          // First, find all column names in the branches table
          const [columnsResult] = await connection.query(
            `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = ?`,
            [clientBranchesTable],
          );

          // Find potential identifier columns (usually primary fields)
          const potentialIdColumns = columnsResult
            .filter(
              (col) =>
                col.COLUMN_NAME.toLowerCase() === "branch_code" ||
                col.COLUMN_NAME.toLowerCase() === "code" ||
                col.COLUMN_NAME.toLowerCase() === "id" ||
                col.COLUMN_NAME.toLowerCase() === "uuid" ||
                col.COLUMN_NAME.toLowerCase() === "branch_id" ||
                col.COLUMN_NAME.toLowerCase() === "region" ||
                col.COLUMN_NAME.toLowerCase() === "area",
            )
            .map((col) => col.COLUMN_NAME);

          // Find email columns
          const emailColumns = columnsResult
            .filter(
              (col) =>
                col.COLUMN_NAME.toLowerCase().includes("email") ||
                col.COLUMN_NAME.toLowerCase().includes("mail"),
            )
            .map((col) => col.COLUMN_NAME);

          // Get all branches records
          const [branchesData] = await connection.query(
            `SELECT * FROM ${clientBranchesTable}`,
          );

          // First, find branches assigned to this user's email
          const userBranches = [];
          const primaryFieldValues = new Set();

          // Normalize user email for comparison
          const normalizedUserEmail = user_email.toLowerCase().trim();

          // Find branches where user's email appears in any email column
          for (const branch of branchesData) {
            let hasAccess = false;

            // Check each potential email column
            for (const emailColumn of emailColumns) {
              const emailValue = branch[emailColumn];
              if (!emailValue) continue;

              // Convert to string for comparison
              const emailValueStr = String(emailValue).toLowerCase();

              // Check for exact match
              if (emailValueStr === normalizedUserEmail) {
                hasAccess = true;
                break;
              }

              // Check for email in comma/semicolon separated list
              if (emailValueStr.includes(",") || emailValueStr.includes(";")) {
                const emails = emailValueStr
                  .split(/[,;]/)
                  .map((e) => e.trim().toLowerCase());

                if (emails.includes(normalizedUserEmail)) {
                  hasAccess = true;
                  break;
                }
              }

              // Check for substring match as last resort
              if (emailValueStr.includes(normalizedUserEmail)) {
                hasAccess = true;
                break;
              }
            }

            // If user has access to this branch, add it to userBranches and collect its primary field values
            if (hasAccess) {
              userBranches.push(branch);

              // Collect all potential primary field values
              for (const idColumn of potentialIdColumns) {
                if (branch[idColumn]) {
                  primaryFieldValues.add(String(branch[idColumn]));
                }
              }
            }
          }

          // Get all reports with their primary field values
          const [reportsData] = await connection.query(
            `SELECT id, primary_field_name, primary_field_value, content 
             FROM ${clientReportsTable} 
             WHERE ${whereClause}`,
            queryParams,
          );

          // Array to store allowed report IDs
          allowedReportIds = [];

          // For each report, check if its primary field value matches any of the user's branch values
          for (const report of reportsData) {
            let hasAccess = false;
            let primaryFieldName = report.primary_field_name;
            let primaryFieldValue = report.primary_field_value;

            // If primary_field_value is missing, try to extract from content
            if (!primaryFieldValue && report.content) {
              try {
                const content =
                  typeof report.content === "string"
                    ? JSON.parse(report.content)
                    : report.content;

                if (content.primaryField) {
                  primaryFieldName = content.primaryField.name;
                  primaryFieldValue = content.primaryField.value;
                }
              } catch (e) {
                console.error("Error parsing report content:", e);
              }
            }

            if (!primaryFieldValue) {
              continue;
            }

            // Convert to string for comparison
            const primaryFieldValueStr =
              String(primaryFieldValue).toLowerCase();

            // Check if any of the user's branch values matches this report's primary field value
            for (const branchValue of primaryFieldValues) {
              const branchValueStr = String(branchValue).toLowerCase();

              // Check for exact match or substring match
              if (
                primaryFieldValueStr === branchValueStr ||
                primaryFieldValueStr.includes(branchValueStr) ||
                branchValueStr.includes(primaryFieldValueStr)
              ) {
                hasAccess = true;
                break;
              }
            }

            // If user has access to this report's branch, add the report ID to allowed list
            if (hasAccess) {
              allowedReportIds.push(report.id);
            } else {
            }
          }

          // If we found allowed reports, add them to the WHERE clause
          if (allowedReportIds.length > 0) {
            whereClause += " AND r.id IN (?)";
            queryParams.push(allowedReportIds);
          } else {
            // If client user has no access to any reports, return empty array

            return res.status(200).json({
              success: true,
              data: [],
              message: "No reports found for this user's branch assignments",
            });
          }
        } catch (error) {
          console.error(`Error filtering reports by branch access:`, error);
          // Continue with regular query if branch filtering fails
        }
      }

      // Query the client-specific table, including dynamic primary field if available
      let reports;
      if (columnsCheck[0].count === 2) {
        // Join with users table to get creator information
        [reports] = await connection.query(
          `SELECT r.*, r.primary_field_name, r.primary_field_value, 
            c.name as creator_name, c.uuid as creator_uuid,
            u.name as updater_name, u.uuid as updater_uuid,
            cl.domain_name as client_domain_name, cl.name as client_name
          FROM ${clientReportsTable} r
          LEFT JOIN users c ON r.created_by = c.id
          LEFT JOIN users u ON r.updated_by = u.id
          LEFT JOIN clients cl ON r.client_id = cl.uuid COLLATE utf8mb4_general_ci
          WHERE ${whereClause}
          ORDER BY r.created_at DESC`,
          queryParams,
        );
      } else {
        // Fallback to original query if columns don't exist yet, but still include user information
        [reports] = await connection.query(
          `SELECT r.*, 
            c.name as creator_name, c.uuid as creator_uuid,
            u.name as updater_name, u.uuid as updater_uuid,
            cl.domain_name as client_domain_name, cl.name as client_name
          FROM ${clientReportsTable} r
          LEFT JOIN users c ON r.created_by = c.id 
          LEFT JOIN users u ON r.updated_by = u.id
          LEFT JOIN clients cl ON r.client_id = cl.uuid COLLATE utf8mb4_general_ci
          WHERE ${whereClause}
          ORDER BY r.created_at DESC`,
          queryParams,
        );
      }

      // Parse JSON fields
      const formattedReports = reports.map((report) => {
        try {
          // Handle colors field
          let parsedColors = {};
          if (report.colors) {
            if (typeof report.colors === "object") {
              parsedColors = report.colors;
            } else {
              parsedColors = JSON.parse(report.colors);
            }
          }

          // Handle content field
          let parsedContent = {};
          if (report.content) {
            if (typeof report.content === "object") {
              parsedContent = report.content;
            } else {
              parsedContent = JSON.parse(report.content);
            }
          }

          // Create primary field information
          const primaryField = {
            name: report.primary_field_name || "branch_code",
            value: report.primary_field_value || null,
          };

          // Add creator and updater info
          const creator = {
            id: report.created_by,
            name: report.creator_name || "Unknown",
            uuid: report.creator_uuid || null,
          };

          const updater = report.updated_by
            ? {
                id: report.updated_by,
                name: report.updater_name || "Unknown",
                uuid: report.updater_uuid || null,
              }
            : null;

          // Add client domain name and client name if available
          const domain_name =
            report.client_domain_name || clientInfo.domain_name;
          const client_name = report.client_name || clientInfo.name;

          return {
            id: report.id,
            client_id: report.client_id,
            client_name: client_name,
            template_name: report.template_name,
            status: report.status,
            created_at: report.created_at,
            updated_at: report.updated_at,
            content: parsedContent,
            colors: parsedColors,
            primary_field: primaryField,
            creator,
            updater,
            domain_name,
            media_links: {
              video_url: report.video_url || null,
              audio_url: report.audio_url || null,
              images_urls: report.images_urls
                ? typeof report.images_urls === "string"
                  ? JSON.parse(report.images_urls)
                  : report.images_urls
                : null,
              pdf_url: report.pdf_url || null,
            },
          };
        } catch (parseError) {
          console.error(
            `Error parsing JSON for report ${report.id}:`,
            parseError,
          );
          return {
            ...report,
            colors: {},
            content: {},
            table: clientReportsTable,
            primary_field: {
              name: report.primary_field_name || "branch_code",
              value: report.primary_field_value || null,
            },
            creator: {
              id: report.created_by,
              name: report.creator_name || "Unknown",
              uuid: report.creator_uuid || null,
            },
            updater: {
              id: report.updated_by,
              name: report.updater_name || "Unknown",
              uuid: report.updater_uuid || null,
            },
            media_links: {
              video_url: report.video_url || null,
              audio_url: report.audio_url || null,
              images_urls: report.images_urls
                ? typeof report.images_urls === "string"
                  ? JSON.parse(report.images_urls)
                  : report.images_urls
                : null,
            },
          };
        }
      });

      return res.status(200).json({
        success: true,
        data: formattedReports,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching reports:", error);
    return res.status(500).json({
      error: "Failed to fetch reports",
      details: error.message,
    });
  }
};

/**
 * Get a single report by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const { table, client_id, user_email, user_role } = req.query;

    if (!id) {
      return res.status(400).json({
        error: "Report ID is required",
      });
    }

    // For direct API calls with a table name/client_id
    const specifiedTable = table;
    const specifiedClientId = client_id;

    const connection = await db.getConnection();

    try {
      // Use the specified table if provided (for direct API access), otherwise determine from client_id
      let clientReportsTable = null;
      let clientBranchesTable = null;
      let resolvedClientId = null;
      let clientDomainName = null;

      if (specifiedTable) {
        // If the table name is explicitly provided, use it directly
        clientReportsTable = specifiedTable;
        clientBranchesTable = specifiedTable.replace("_reports", "_branches");
      } else if (specifiedClientId) {
        // If the client_id is directly provided, use it to determine the table name
        resolvedClientId = specifiedClientId;
        const [clientResult] = await connection.query(
          "SELECT name, domain_name FROM clients WHERE id = ? OR uuid = ?",
          [specifiedClientId, specifiedClientId],
        );

        if (clientResult.length === 0) {
          return res.status(404).json({
            error: "Client not found",
          });
        }

        const clientName = clientResult[0].name
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "")
          .toLowerCase();

        clientReportsTable = `${clientName}_reports`;
        clientBranchesTable = `${clientName}_branches`;
        clientDomainName = clientResult[0].domain_name;
      } else {
        // If neither is provided, try to find the client_id in the reports table
        // This is a fallback for older clients or compatibility
        const [reportClientQuery] = await connection.query(
          "SELECT client_id FROM reports WHERE id = ?",
          [id],
        );

        if (reportClientQuery.length === 0) {
        } else {
          resolvedClientId = reportClientQuery[0].client_id;
          const [clientResult] = await connection.query(
            "SELECT name, domain_name FROM clients WHERE id = ? OR uuid = ?",
            [resolvedClientId, resolvedClientId],
          );

          if (clientResult.length === 0) {
            return res.status(404).json({
              error: "Client not found",
            });
          }

          const clientName = clientResult[0].name
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_]/g, "")
            .toLowerCase();

          clientReportsTable = `${clientName}_reports`;
          clientBranchesTable = `${clientName}_branches`;
          clientDomainName = clientResult[0].domain_name;
        }
      }

      let report = null;

      // Check if the client-specific table exists and try to fetch from it first
      if (clientReportsTable) {
        const [tableExists] = await connection.query(
          "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
          [clientReportsTable],
        );

        if (tableExists[0].count > 0) {
          [report] = await connection.query(
            `SELECT r.*, cl.domain_name as client_domain_name, cl.name as client_name, 
             r.video_url, r.audio_url, r.images_urls
             FROM ${clientReportsTable} r 
             LEFT JOIN clients cl ON r.client_id = cl.uuid COLLATE utf8mb4_general_ci
             WHERE r.id = ?`,
            [id],
          );

          // If report found, check client_user access
          if (
            report.length > 0 &&
            user_role === "client_user" &&
            user_email &&
            clientBranchesTable
          ) {
            const [branchesTableExists] = await connection.query(
              "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
              [clientBranchesTable],
            );

            if (branchesTableExists[0].count > 0) {
              // Get the primary field details from the report
              const reportData = report[0];
              const primaryFieldName = reportData.primary_field_name;
              let primaryFieldValue = reportData.primary_field_value;

              // If primary_field_value is missing, try to extract from content
              if (!primaryFieldValue && reportData.content) {
                try {
                  const content =
                    typeof reportData.content === "string"
                      ? JSON.parse(reportData.content)
                      : reportData.content;

                  if (content.primaryField) {
                    primaryFieldName = content.primaryField.name;
                    primaryFieldValue = content.primaryField.value;
                  }
                } catch (e) {
                  console.error("Error parsing report content:", e);
                }
              }

              if (primaryFieldName && primaryFieldValue) {
                // Find all email columns in the branches table
                const [columnsResult] = await connection.query(
                  `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = ?
                   AND COLUMN_NAME LIKE '%email%'`,
                  [clientBranchesTable],
                );

                if (columnsResult.length > 0) {
                  // Get the branch that matches the report's primary field
                  const [branchData] = await connection.query(
                    `SELECT * FROM ${clientBranchesTable} 
                     WHERE ${primaryFieldName} = ?`,
                    [primaryFieldValue],
                  );

                  if (branchData.length > 0) {
                    // Check if user's email is in any of the branch's email columns
                    let hasAccess = false;
                    const branch = branchData[0];

                    for (const col of columnsResult) {
                      const columnName = col.COLUMN_NAME;

                      // Check exact match
                      if (branch[columnName] === user_email) {
                        hasAccess = true;
                        break;
                      }

                      // Check comma-separated list
                      if (
                        typeof branch[columnName] === "string" &&
                        branch[columnName].includes(",")
                      ) {
                        const emails = branch[columnName]
                          .split(",")
                          .map((e) => e.trim());
                        if (emails.includes(user_email)) {
                          hasAccess = true;
                          break;
                        }
                      }
                    }

                    if (!hasAccess) {
                      return res.status(403).json({
                        error:
                          "You don't have permission to access this report",
                        message:
                          "This report belongs to a branch you are not assigned to",
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }

      // If we still don't have a report, try the main reports table as a fallback
      if (!report || report.length === 0) {
        [report] = await connection.query(
          `SELECT r.*, cl.domain_name as client_domain_name, cl.name as client_name,
             r.video_url, r.audio_url, r.images_urls
             FROM reports r
             LEFT JOIN clients cl ON r.client_id = cl.uuid COLLATE utf8mb4_general_ci
             WHERE r.id = ?`,
          [id],
        );
      }

      // If no report found in any table
      if (!report || report.length === 0) {
        return res.status(404).json({
          error: "Report not found",
          message: `No report found with ID ${id} in any table`,
        });
      }

      // Prepare report data for response
      const reportData = report[0];
      let formattedReport = { ...reportData };

      // Add domain_name and client_name from client or query result
      formattedReport.domain_name =
        reportData.client_domain_name || clientDomainName;
      formattedReport.client_name = reportData.client_name;

      // Extract creator and updater information if available
      if (reportData.created_by) {
        const [creatorResult] = await connection.query(
          "SELECT id, name, uuid FROM users WHERE id = ?",
          [reportData.created_by],
        );

        if (creatorResult.length > 0) {
          formattedReport.creator = creatorResult[0];
        }
      }

      if (reportData.updated_by) {
        const [updaterResult] = await connection.query(
          "SELECT id, name, uuid FROM users WHERE id = ?",
          [reportData.updated_by],
        );

        if (updaterResult.length > 0) {
          formattedReport.updater = updaterResult[0];
        }
      }

      // Include the table name in the response for reference
      formattedReport.table = clientReportsTable || "reports";

      // Parse content if it's stored as JSON string
      if (
        formattedReport.content &&
        typeof formattedReport.content === "string"
      ) {
        try {
          formattedReport.content = JSON.parse(formattedReport.content);
        } catch (e) {
          console.error("Error parsing report content:", e);
        }
      }

      // Parse colors if it's stored as JSON string
      if (
        formattedReport.colors &&
        typeof formattedReport.colors === "string"
      ) {
        try {
          formattedReport.colors = JSON.parse(formattedReport.colors);
        } catch (e) {
          console.error("Error parsing report colors:", e);
        }
      }

      // Add media links to the formatted report with consistent format
      formattedReport.media_links = {
        video_url: reportData.video_url || null,
        audio_url: reportData.audio_url || null,
        images_urls: reportData.images_urls
          ? typeof reportData.images_urls === "string"
            ? JSON.parse(reportData.images_urls)
            : report.images_urls
          : null,
      };

      return res.status(200).json({
        success: true,
        data: formattedReport,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in getReportById:", error);
    return res.status(500).json({
      error: error.message || "An error occurred while fetching the report",
    });
  }
};

/**
 * Delete a report
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { client_id, table } = req.query;

    if (!id) {
      return res.status(400).json({
        error: "Report ID is required",
      });
    }

    // Either client_id or table must be provided
    if (!client_id && !table) {
      return res.status(400).json({
        error: "Either client_id or table name is required",
      });
    }

    const connection = await db.getConnection();

    try {
      let clientReportsTable;

      // If table name is provided directly, use it
      if (table) {
        clientReportsTable = table;
      }
      // Otherwise, derive it from client_id
      else {
        // Get client name - try both id and uuid

        // First try with id
        let [clientResult] = await connection.query(
          "SELECT name FROM clients WHERE id = ?",
          [client_id],
        );

        // If not found, try with uuid
        if (clientResult.length === 0) {
          [clientResult] = await connection.query(
            "SELECT name FROM clients WHERE uuid = ?",
            [client_id],
          );

          // If still not found, return 404
          if (clientResult.length === 0) {
            return res.status(404).json({
              error: "Client not found",
            });
          }
        }

        // Format client name for table name
        const clientName = clientResult[0].name
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "")
          .toLowerCase();

        clientReportsTable = `${clientName}_reports`;
      }

      // Check if the table exists
      const [tableExists] = await connection.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
        [clientReportsTable],
      );

      if (tableExists[0].count === 0) {
        return res.status(404).json({
          error: `Report table ${clientReportsTable} does not exist`,
        });
      }

      // Check if report exists
      const [report] = await connection.query(
        `SELECT id FROM ${clientReportsTable} WHERE id = ?`,
        [id],
      );

      if (report.length === 0) {
        return res.status(404).json({
          error: "Report not found",
        });
      }

      // Delete the report
      await connection.query(`DELETE FROM ${clientReportsTable} WHERE id = ?`, [
        id,
      ]);

      return res.status(200).json({
        success: true,
        message: `Report deleted successfully from ${clientReportsTable}`,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error deleting report:", error);
    return res.status(500).json({
      error: "Failed to delete report",
      details: error.message,
    });
  }
};

/**
 * Update report status
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, user_id: requestUserId } = req.body;
    const { client_id, table } = req.query;
    // Use user_id from request payload if provided, otherwise fall back to JWT token
    const user_id = requestUserId || req.user?.id || null;

    if (!id) {
      return res.status(400).json({
        error: "Report ID is required",
      });
    }

    if (!status) {
      return res.status(400).json({
        error: "Status is required",
      });
    }

    // Either client_id or table must be provided
    if (!client_id && !table) {
      return res.status(400).json({
        error: "Either client_id or table name is required",
      });
    }

    // Validate status value
    const validStatuses = ["draft", "submitted", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const connection = await db.getConnection();

    try {
      let clientReportsTable;

      // If table name is provided directly, use it
      if (table) {
        clientReportsTable = table;
      }
      // Otherwise, derive it from client_id
      else {
        // Get client name - try both id and uuid

        // First try with id
        let [clientResult] = await connection.query(
          "SELECT name FROM clients WHERE id = ?",
          [client_id],
        );

        // If not found, try with uuid
        if (clientResult.length === 0) {
          [clientResult] = await connection.query(
            "SELECT name FROM clients WHERE uuid = ?",
            [client_id],
          );

          // If still not found, return 404
          if (clientResult.length === 0) {
            return res.status(404).json({
              error: "Client not found",
            });
          }
        }

        // Format client name for table name
        const clientName = clientResult[0].name
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "")
          .toLowerCase();

        clientReportsTable = `${clientName}_reports`;
      }

      // Check if the table exists
      const [tableExists] = await connection.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
        [clientReportsTable],
      );

      if (tableExists[0].count === 0) {
        return res.status(404).json({
          error: `Report table ${clientReportsTable} does not exist`,
        });
      }

      // Check if report exists and get report details
      const [reportDetails] = await connection.query(
        `SELECT id, created_by, template_name, created_at FROM ${clientReportsTable} WHERE id = ?`,
        [id],
      );

      if (reportDetails.length === 0) {
        return res.status(404).json({
          error: "Report not found",
        });
      }

      // Get the report creator's user ID and other details
      const reportCreatorId = reportDetails[0].created_by;
      const reportName = reportDetails[0].template_name || "Unknown Report";
      const reportCreatedAt = reportDetails[0].created_at;

      // Update the report status
      await connection.query(
        `UPDATE ${clientReportsTable} SET status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?`,
        [status, user_id, id],
      );

      // Also update the user_performance table
      if (reportCreatorId && client_id) {
        try {
          // Convert client_id to numeric ID if it's a UUID
          let clientNumericId = client_id;
          if (isNaN(Number(client_id))) {
            const [clientResult] = await connection.query(
              "SELECT id FROM clients WHERE uuid = ?",
              [client_id],
            );
            if (clientResult.length > 0) {
              clientNumericId = clientResult[0].id;
            }
          }

          // First, query the existing user_performance record to get current values
          const [existingPerformance] = await connection.query(
            `SELECT report_time, elapsed_seconds, score FROM user_performance 
             WHERE client_id = ? AND user_id = ? AND report_id = ?`,
            [clientNumericId, reportCreatorId, id],
          );

          // Prepare data for user_performance update
          const performanceData = {
            client_id: clientNumericId,
            user_id: reportCreatorId,
            report_id: id,
            report_name: reportName,
            // Preserve existing values instead of setting to 0
            report_time:
              existingPerformance.length > 0
                ? existingPerformance[0].report_time
                : null,
            creation_timestamp: reportCreatedAt,
            elapsed_seconds:
              existingPerformance.length > 0
                ? existingPerformance[0].elapsed_seconds
                : null,
            status: status, // Using the new status
            score:
              existingPerformance.length > 0
                ? existingPerformance[0].score
                : null,
          };

          // Update user_performance status
          await trackUserPerformance(performanceData);
        } catch (perfError) {
          console.error("Error updating user_performance record:", perfError);
          // Don't fail the request if this update fails
        }
      }

      return res.status(200).json({
        success: true,
        message: `Report status updated successfully to ${status}`,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating report status:", error);
    return res.status(500).json({
      error: "Failed to update report status",
      details: error.message,
    });
  }
};

/**
 * Get client dashboard data
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getClientDashboardData = async (req, res) => {
  const perfStart = Date.now();

  try {
    // Get client_id from either the request body (POST) or query parameters (GET)
    const { client_id, user_email, user_role, filters, branch_ids } =
      req.body || req.query;

    if (!client_id) {
      return res.status(400).json({
        error: "Client ID is required",
      });
    }
    // Check if the client exists and get proper client table name
    const [clientResult] = await db.query(
      "SELECT name FROM clients WHERE id = ? OR uuid = ?",
      [client_id, client_id],
    );

    if (clientResult.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Client not found",
      });
    }
    // Format client name for table name
    const clientNameReports = clientResult[0].name
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();

    // Format client name for table name
    const clientNameBranches = clientResult[0].name
      .replace(/\s+/g, "_")
      .replace(/-/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();

    // Use client-specific table
    const clientReportsTable = `${clientNameReports}_reports`;
    const clientBranchesTable = `${clientNameBranches}_branches`;

    // DEBUG: Show what branch tables actually exist
    const [allBranchTables] = await db.query(
      `SELECT TABLE_NAME FROM information_schema.tables 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME LIKE '%branches%'`,
    );

    // Check if the table exists
    const [tableExists] = await db.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
      [clientReportsTable],
    );

    if (tableExists[0].count === 0) {
      return res.status(404).json({
        status: "error",
        message: `Client reports table ${clientReportsTable} does not exist`,
      });
    }

    // Get the columns from the client-specific reports table
    const [columns] = await db.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
      [clientReportsTable],
    );

    // Build a dynamic query using only the columns that exist
    const columnNames = columns.map((col) => col.COLUMN_NAME);

    // Select only columns that we need and that exist in the table
    const selectColumns = [];
    const standardColumns = [
      "id",
      "client_id",
      "primary_field_name",
      "primary_field_value",
      "template_name",
      "status",
      "created_at",
      "updated_at",
    ];

    standardColumns.forEach((col) => {
      if (columnNames.includes(col)) {
        selectColumns.push(`r.${col}`);
      }
    });

    // Add content as it contains other useful data
    if (columnNames.includes("content")) {
      selectColumns.push("r.content");
    }

    // Add media URL columns if they exist
    const mediaColumns = [
      "video_url",
      "audio_url",
      "images_urls",
      "timestamp_url",
      "pdf_url",
    ];

    mediaColumns.forEach((col) => {
      if (columnNames.includes(col)) {
        selectColumns.push(`r.${col}`);
      }
    });

    // Build the WHERE clause - only filter by client_id and status
    // NOTE: All UI filters are applied post-enrichment for consistency
    let whereClause = "r.client_id = ? AND r.status = 'approved'";
    let queryParams = [client_id];

    // Special handling for client_user role - they should only see reports for their assigned branches
    let allowedReportIds = null;
    const isClientUser = user_role === "client_user";

    if (isClientUser && user_email) {
      // Check if the client-specific branches table exists
      const [branchesTableExists] = await db.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
        [clientBranchesTable],
      );

      if (branchesTableExists[0].count > 0) {
        try {
          // First, check what primary_field_name is being used in reports
          const [primaryFieldCheckQuery] = await db.query(
            `SELECT DISTINCT primary_field_name FROM ${clientReportsTable} LIMIT 1`,
          );

          // Default to br__code if we can't determine it
          let primaryFieldNameInReports = "br__code";
          if (
            primaryFieldCheckQuery.length > 0 &&
            primaryFieldCheckQuery[0].primary_field_name
          ) {
            primaryFieldNameInReports =
              primaryFieldCheckQuery[0].primary_field_name;
          }

          // Get all columns from branches table to match fields that might contain user email
          const [branchColumnsResult] = await db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = ?`,
            [clientBranchesTable],
          );

          const branchColumnNames = branchColumnsResult.map(
            (col) => col.COLUMN_NAME,
          );

          // Fields that might contain email addresses
          const emailFields = branchColumnNames.filter(
            (col) =>
              col.toLowerCase().includes("email") ||
              col.toLowerCase().includes("manager") ||
              col.toLowerCase().includes("head") ||
              col.toLowerCase() === "emails",
          );

          // Get all branches data
          const [branchesData] = await db.query(
            `SELECT * FROM ${clientBranchesTable}`,
          );

          // Normalize the user email
          const normalizedUserEmail = user_email.toLowerCase().trim();

          // Find branches accessible to this user
          const accessibleBranches = [];
          const primaryFieldValues = new Set();

          for (const branch of branchesData) {
            let hasAccess = false;

            // Check all potential email fields
            for (const field of emailFields) {
              if (!branch[field]) continue;

              const fieldValue = String(branch[field]).toLowerCase();

              // Check exact match
              if (fieldValue === normalizedUserEmail) {
                hasAccess = true;
                break;
              }

              // Check comma/semicolon separated list
              if (fieldValue.includes(",") || fieldValue.includes(";")) {
                const emails = fieldValue
                  .split(/[,;]/)
                  .map((e) => e.trim().toLowerCase());

                if (emails.includes(normalizedUserEmail)) {
                  hasAccess = true;
                  break;
                }
              }

              // Check substring match only if email is properly formatted
              // This makes it less likely to match incorrect partial strings
              if (
                normalizedUserEmail.includes("@") &&
                fieldValue.includes("@") &&
                (fieldValue.includes(normalizedUserEmail) ||
                  normalizedUserEmail.includes(fieldValue))
              ) {
                // Only accept substring match if both are valid email formats

                hasAccess = true;
                break;
              }
            }

            if (hasAccess) {
              accessibleBranches.push(branch);

              // Get the primary field value that will be used to match reports
              if (branch[primaryFieldNameInReports]) {
                primaryFieldValues.add(
                  String(branch[primaryFieldNameInReports]),
                );
              } else {
                // Fallback to searching common branch identifier fields if the exact field isn't found
                const commonBranchFields = [
                  "br__code",
                  "branch_code",
                  "code",
                  "id",
                  "branch_name",
                ];
                for (const field of commonBranchFields) {
                  if (branch[field]) {
                    primaryFieldValues.add(String(branch[field]));

                    break;
                  }
                }
              }
            }
          }

          // Filter reports based on accessible branch identifiers
          if (primaryFieldValues.size > 0) {
            // Get all reports
            const [allReports] = await db.query(
              `SELECT id, primary_field_name, primary_field_value, content 
               FROM ${clientReportsTable} r
               WHERE ${whereClause}`,
              queryParams,
            );

            // Filter reports by branch access
            allowedReportIds = [];

            for (const report of allReports) {
              let primaryFieldValue = report.primary_field_value;

              // If primary_field_value is missing, try to extract from content
              if (!primaryFieldValue && report.content) {
                try {
                  const content =
                    typeof report.content === "string"
                      ? JSON.parse(report.content)
                      : report.content;

                  if (content.primaryField && content.primaryField.value) {
                    primaryFieldValue = content.primaryField.value;
                  }
                } catch (e) {
                  console.error("Error parsing report content:", e);
                }
              }

              if (!primaryFieldValue) {
                continue;
              }

              // Convert to string for comparison
              const reportPrimaryValue =
                String(primaryFieldValue).toLowerCase();

              // Check against branch identifiers
              let hasAccess = false;
              for (const branchValue of primaryFieldValues) {
                const branchValueStr = String(branchValue).toLowerCase();

                // Match if either contains the other (to handle partial matches like "1234" in "1234-Branch Name")
                if (
                  reportPrimaryValue === branchValueStr ||
                  reportPrimaryValue.includes(branchValueStr) ||
                  branchValueStr.includes(reportPrimaryValue)
                ) {
                  hasAccess = true;
                  break;
                }
              }

              if (hasAccess) {
                allowedReportIds.push(report.id);
              }
            }

            // Add filter to WHERE clause if we found accessible reports
            if (allowedReportIds.length > 0) {
              whereClause += " AND r.id IN (?)";
              queryParams.push(allowedReportIds);
            } else {
              // If no reports are accessible, return empty results
              return res.status(200).json({
                status: "success",
                data: [],
                message: "No reports found for your branch assignments",
              });
            }
          } else {
            // If user has no branch access, return empty results
            return res.status(200).json({
              status: "success",
              data: [],
              message: "No branch assignments found for your account",
            });
          }
        } catch (error) {
          console.error(`Error filtering reports by branch access:`, error);
          // Continue with regular query if branch filtering fails
        }
      } else {
      }
    } else {
    }

    // Filter by specific branch_ids if provided in the request
    if (branch_ids && Array.isArray(branch_ids) && branch_ids.length > 0) {
      try {
        // Check if branches table exists to map branch IDs to primary field values
        const [branchesTableExists] = await db.query(
          "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
          [clientBranchesTable],
        );

        if (branchesTableExists[0].count > 0) {
          // Get the primary field name used in reports
          const [primaryFieldCheckQuery] = await db.query(
            `SELECT DISTINCT primary_field_name FROM ${clientReportsTable} WHERE primary_field_name IS NOT NULL LIMIT 1`,
          );

          let primaryFieldNameInReports = "br__code"; // default
          if (
            primaryFieldCheckQuery.length > 0 &&
            primaryFieldCheckQuery[0].primary_field_name
          ) {
            primaryFieldNameInReports =
              primaryFieldCheckQuery[0].primary_field_name;
          }

          // Get branches data for the provided branch_ids
          const placeholders = branch_ids.map(() => "?").join(",");
          const [branchesData] = await db.query(
            `SELECT id, ${primaryFieldNameInReports} as primary_value FROM ${clientBranchesTable} WHERE id IN (${placeholders})`,
            branch_ids,
          );

          // Extract primary field values from these branches
          const primaryFieldValues = branchesData
            .map((branch) => branch.primary_value)
            .filter((value) => value != null && value !== "");

          if (primaryFieldValues.length > 0) {
            // Add WHERE clause to filter by these primary field values
            const placeholders = primaryFieldValues.map(() => "?").join(",");
            whereClause += ` AND r.primary_field_value IN (${placeholders})`;
            queryParams.push(...primaryFieldValues);
          } else {
          }
        } else {
        }
      } catch (error) {
        console.error(`Error applying branch_ids filter:`, error);
      }
    }

    // Execute the query with our dynamic WHERE clause
    // Limit to last 1000 reports for performance (can be adjusted)
    const query = `
      SELECT ${selectColumns.join(", ")}
      FROM ${clientReportsTable} r
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT 1000
    `;

    const [reports] = await db.query(query, queryParams);

    // If we have reports and a user email, double check email-based access
    if (reports.length > 0 && isClientUser && user_email) {
      const normalizedUserEmail = user_email.toLowerCase().trim();

      // Filter reports to only include those where the user email is in any email-related field
      const emailAccessReports = reports.filter((report) => {
        // Check all fields in the report that might contain emails
        for (const field in report) {
          if (
            field.toLowerCase().includes("email") ||
            field.toLowerCase().includes("manager")
          ) {
            if (report[field]) {
              const fieldValue = String(report[field]).toLowerCase();

              // Exact match
              if (fieldValue === normalizedUserEmail) {
                return true;
              }

              // Check comma/semicolon separated list
              if (fieldValue.includes(",") || fieldValue.includes(";")) {
                const emails = fieldValue
                  .split(/[,;]/)
                  .map((e) => e.trim().toLowerCase());

                if (emails.includes(normalizedUserEmail)) {
                  return true;
                }
              }
            }
          }
        }

        // Check content object too
        if (report.content) {
          try {
            const content =
              typeof report.content === "string"
                ? JSON.parse(report.content)
                : report.content;

            for (const field in content) {
              if (
                field.toLowerCase().includes("email") ||
                field.toLowerCase().includes("manager")
              ) {
                if (content[field]) {
                  const fieldValue = String(content[field]).toLowerCase();

                  if (
                    fieldValue === normalizedUserEmail ||
                    (fieldValue.includes(",") &&
                      fieldValue
                        .split(",")
                        .map((e) => e.trim())
                        .includes(normalizedUserEmail)) ||
                    (fieldValue.includes(";") &&
                      fieldValue
                        .split(";")
                        .map((e) => e.trim())
                        .includes(normalizedUserEmail))
                  ) {
                    return true;
                  }
                }
              }
            }
          } catch (error) {
            console.error(
              `Error checking email in content for report ${report.id}:`,
              error,
            );
          }
        }
        return false;
      });

      // If we found any reports with direct email access, use only those
      if (emailAccessReports.length > 0) {
        reports.length = 0; // Clear the array
        reports.push(...emailAccessReports); // Replace with email-filtered reports
      } else {
      }
    }

    // Process the reports to extract needed fields from content if they don't exist as columns
    const processedReports = reports.map((report) => {
      let reportData = { ...report };

      // Add media_links object if media URLs exist
      reportData.media_links = {
        video_url: report.video_url || null,
        audio_url: report.audio_url || null,
        images_urls: report.images_urls
          ? typeof report.images_urls === "string"
            ? JSON.parse(report.images_urls)
            : report.images_urls
          : null,
        timestamp_url: report.timestamp_url || null,
        pdf_url: report.pdf_url || null,
      };

      // Extract data from content if it exists
      if (report.content) {
        try {
          const content =
            typeof report.content === "string"
              ? JSON.parse(report.content)
              : report.content;

          // Extract branch name, score, etc. from content
          if (content.primaryField) {
            reportData.branch_name = content.primaryField.value;
          }

          // Check if reports array exists (containing sections with achieved percentages)
          if (Array.isArray(content.reports)) {
            // Calculate overall score using total achieved/applicable scores
            let totalAchievedScore = 0;
            let totalApplicableScore = 0;

            content.reports.forEach((section) => {
              // Sum up the total achieved and applicable scores from each section
              const achieved = Number(section.total_achieved_score);
              const applicable = Number(section.total_applicable_score);

              if (!isNaN(achieved) && !isNaN(applicable)) {
                totalAchievedScore += achieved;
                totalApplicableScore += applicable;
              }
            });

            // Calculate final score as (total_achieved_score / total_applicable_score) * 100
            if (totalApplicableScore > 0) {
              reportData.score = Math.round(
                (totalAchievedScore / totalApplicableScore) * 100,
              );
            } else {
              reportData.score = 0;
            }

            // Store the sections data for reference
            reportData.sections = content.reports.map((section) => ({
              heading: section.heading || "",
              achieved: section.achieved || "0%",
              weightage: section.weightage || "0%",
              total_achieved_score: section.total_achieved_score || 0,
              total_applicable_score: section.total_applicable_score || 0,
            }));
          }
          // If no reports array but content has score directly
          else if (content.score !== undefined) {
            reportData.score = content.score;
          } else if (content.totalScore !== undefined) {
            reportData.score = content.totalScore;
          }

          // Try to find report type
          if (content.reportType) {
            reportData.report_type = content.reportType;
          }

          // Extract date if available
          if (content.date) {
            reportData.date = content.date;
          }
        } catch (error) {
          console.error("Error parsing content JSON:", error);
        }
      }

      return reportData;
    });

    const enrichedReports = await enrichReportsWithBranchData(
      processedReports,
      clientBranchesTable,
    );

    // Normalize month and formatted_date BEFORE filtering (so filters can use these fields)
    const monthName = (d) => d.toLocaleString("default", { month: "long" });
    const monthYear = (d) => `${monthName(d)} ${d.getFullYear()}`;
    const coerceDate = (r) => {
      // try direct fields first
      const direct = r.date || r.created_at;
      let d = direct ? new Date(direct) : null;
      if (d && !isNaN(d.getTime())) return d;
      // fallback to content JSON
      try {
        if (r.content) {
          const c =
            typeof r.content === "string" ? JSON.parse(r.content) : r.content;
          const v =
            c?.date ||
            c?.selectedFieldValues?.date ||
            c?.selectedFieldValues?.visit_date ||
            c?.selectedFieldValues?.audit_date ||
            c?.selectedFieldValues?.inspection_date;
          if (v) {
            const dd = new Date(v);
            if (!isNaN(dd.getTime())) return dd;
          }
        }
      } catch (_) {}
      return null;
    };

    enrichedReports.forEach((r) => {
      const d = coerceDate(r);
      if (d) {
        r.month = monthYear(d);
        const day = String(d.getDate()).padStart(2, "0");
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const y = d.getFullYear();
        r.formatted_date = `${day}/${m}/${y}`;
      } else {
        r.month = "N/A";
        r.formatted_date = "N/A";
      }
    });

    enrichedReports.forEach((r) => {
      const primaryName = (r.primary_field_name || "").toLowerCase();
      const primaryValue = (r.primary_field_value || "").toString().trim();
      // Canonical branch name: prefer enriched branch table value
      r.branch_name = (
        r.branch_branch_name ||
        r.branch_name ||
        r.branch ||
        r.name ||
        ""
      )
        .toString()
        .trim();
      // Canonical branch code: prefer enriched branch table value
      r.branch_code = (r.branch_branch_code || r.branch_code || "")
        .toString()
        .trim();
      // Fallback from primary field only when appropriate
      if (!r.branch_name && primaryName === "branch_name")
        r.branch_name = primaryValue;
      if (!r.branch_code && primaryName === "branch_code")
        r.branch_code = primaryValue;
    });

    // Apply post-enrichment filters (for ALL UI filters - ensures consistent cascading)
    let approvedReports = enrichedReports;
    if (filters && Object.keys(filters).length > 0) {
      // Track excluded reports for debugging
      const excludedReports = [];

      approvedReports = enrichedReports.filter((report) => {
        // Check each filter
        for (const [field, value] of Object.entries(filters)) {
          if (!value) continue; // Skip empty filters

          const reportValue = (report[field] ?? "").toString().trim();
          const filterValue = value.toString().trim();

          // Case-insensitive exact match
          if (reportValue.toLowerCase() !== filterValue.toLowerCase()) {
            // Debug: track why this report was excluded
            excludedReports.push({
              id: report.id,
              field: field,
              expected: filterValue,
              actual: reportValue || "(empty)",
              match: reportValue.toLowerCase() === filterValue.toLowerCase(),
            });
            return false; // This report doesn't match, exclude it
          }
        }
        return true; // All filters matched
      });

      // Log excluded reports if count seems off
      if (excludedReports.length > 0 && excludedReports.length < 20) {
        excludedReports
          .slice(0, 5)
          .map(
            (e) =>
              `ID:${e.id} ${e.field}="${e.actual}" (expected "${e.expected}")`,
          )
          .join(", ");
      }
    } else {
    }

    // Metrics
    const totalReports = approvedReports.length;
    const averageScore = totalReports
      ? Math.round(
          (approvedReports.reduce((sum, r) => sum + (Number(r.score) || 0), 0) /
            totalReports) *
            10,
        ) / 10
      : 0;
    const completionRate = totalReports
      ? Math.round(
          (approvedReports.filter((r) => (Number(r.score) || 0) > 0).length /
            totalReports) *
            100,
        )
      : 0;

    // Unique branches count (normalized)
    const uniqueBranches = new Set(
      approvedReports
        .map((r) =>
          (r.primary_field_value || r.branch_name || r.branch || "")
            .toString()
            .trim()
            .toLowerCase(),
        )
        .filter((v) => v),
    );
    const uniqueBranchesCount = uniqueBranches.size;

    // (Month and branch normalization already done before filtering)

    // Rankings
    const getScore = (score) => {
      const num = parseFloat(String(score));
      return isNaN(num) ? 0 : num;
    };

    const sortedByScore = [...approvedReports].sort((a, b) => {
      return getScore(b.score) - getScore(a.score);
    });

    const topReports = sortedByScore.slice(0, 5);
    const bottomReports = sortedByScore.slice(-5).reverse();

    // Filter options and counts based on currently filtered dataset
    // Dynamically compute options for all fields in enriched reports
    const filterOptions = {};
    const filterCounts = {};

    // Excluded fields that shouldn't be used as filters
    const excludedFields = [
      "id",
      "uuid",
      "client_id",
      "created_at",
      "updated_at",
      "content",
      "status",
      "emails",
      "sr_number",
      "sr___",
      "table",
      "branch_manager_email",
      "branch_manager",
      "area_manager_email",
      "region_manager_email",
      "email",
      "manager_email",
      "email_address",
      "branch_matched",
      "branch_match_field",
      "branch_match_value",
      "sections",
      "score",
      "total_achieved_score",
      "total_applicable_score",
    ];

    if (filters && Object.keys(filters).length > 0) {
    }

    // OPTIMIZATION: Build filter options in a single pass through the data
    const filterValuesMap = {}; // Track unique values per field

    // DEBUG: Track problematic fields
    const debugFields = ["brands_e_store_name", "order_number", "city"];
    const debugValues = {};

    // Extract filter options ONLY from the reports the user has access to (approvedReports)
    // This ensures users only see filter values for their accessible data

    approvedReports.forEach((r, idx) => {
      Object.keys(r).forEach((key) => {
        // Skip excluded fields and email-related fields
        if (
          excludedFields.includes(key) ||
          key.toLowerCase().includes("email") ||
          key.toLowerCase().includes("sr_")
        ) {
          return;
        }

        // Initialize Set for this field if not exists
        if (!filterValuesMap[key]) {
          filterValuesMap[key] = new Set();
        }

        // DEBUG: Log first 3 values for problematic fields
        if (debugFields.includes(key) && idx < 3) {
          if (!debugValues[key]) debugValues[key] = [];
          debugValues[key].push({
            raw: r[key],
            trimmed: (r[key] ?? "").toString().trim(),
          });
        }

        // Add value if valid
        const v = (r[key] ?? "").toString().trim();
        if (v && v !== "null" && v !== "undefined") {
          filterValuesMap[key].add(v);
        }
      });
    });

    // DEBUG: Log raw values for problematic fields
    if (Object.keys(debugValues).length > 0) {
    }

    // Convert Sets to sorted arrays
    Object.keys(filterValuesMap).forEach((field) => {
      if (filterValuesMap[field].size > 0) {
        filterOptions[field] = Array.from(filterValuesMap[field]).sort();
        filterCounts[field] = filterOptions[field].length;
      }
    });

    // Log filter counts for debugging

    // Optimize payload: exclude heavy 'content' field (keep only essential data)
    const optimizedReports = approvedReports.map((report) => {
      const { content, ...essentialData } = report;
      return essentialData;
    });

    return res.status(200).json({
      status: "success",
      message: "Reports fetched successfully",
      data: optimizedReports,
      test: { sortedByScore, approvedReports },
      metrics: {
        totalReports,
        averageScore,
        completionRate,
        uniqueBranchesCount,
      },
      ranking: { topReports, bottomReports },
      filters: { options: filterOptions, counts: filterCounts },
    });
  } catch (error) {
    console.error("Error fetching client dashboard data:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch client dashboard data",
      error: error.message,
    });
  }
};

// In-memory cache for branch data (prevents repeated DB queries)
const branchDataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Enrich reports with branch data based on primary field matching
 * @param {Array} reports - Array of report objects
 * @param {string} clientBranchesTable - Name of the client-specific branches table
 * @returns {Array} - Array of enriched report objects
 */
const enrichReportsWithBranchData = async (reports, clientBranchesTable) => {
  try {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = clientBranchesTable;
    const cached = branchDataCache.get(cacheKey);

    let allBranches, branchColumnNames;

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      allBranches = cached.branches;
      branchColumnNames = cached.columnNames;
    } else {
      // Check if the branches table exists
      const [branchesTableExists] = await db.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
        [clientBranchesTable],
      );

      if (branchesTableExists[0].count === 0) {
        return reports;
      }

      // Get all columns from the branches table
      const [branchColumns] = await db.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
        [clientBranchesTable],
      );

      branchColumnNames = branchColumns.map((col) => col.COLUMN_NAME);

      // DEBUG: Check if the problematic fields exist in branches table
      const debugFields = ["brands_e_store_name", "order_number", "city"];
      const missingFields = debugFields.filter(
        (f) => !branchColumnNames.includes(f),
      );
      const existingFields = debugFields.filter((f) =>
        branchColumnNames.includes(f),
      );
      if (missingFields.length > 0) {
      }
      if (existingFields.length > 0) {
      }

      // OPTIMIZATION: Fetch ALL branch data once instead of querying for each report

      const [fetchedBranches] = await db.query(
        `SELECT * FROM ${clientBranchesTable}`,
      );
      allBranches = fetchedBranches;

      // DEBUG: Show sample values from first branch for problematic fields
      if (allBranches.length > 0) {
        const debugFields = ["brands_e_store_name", "order_number", "city"];
        const firstBranch = allBranches[0];
        const sampleValues = {};
        debugFields.forEach((field) => {
          if (firstBranch[field] !== undefined) {
            sampleValues[field] = firstBranch[field];
          }
        });
        if (Object.keys(sampleValues).length > 0) {
        }
      }

      // Cache the data
      branchDataCache.set(cacheKey, {
        branches: allBranches,
        columnNames: branchColumnNames,
        timestamp: Date.now(),
      });
    }

    // Create lookup maps for each possible primary field
    // This allows O(1) lookups instead of querying the database for each report
    const branchLookups = {};
    branchColumnNames.forEach((columnName) => {
      branchLookups[columnName] = new Map();
    });

    // Populate the lookup maps
    allBranches.forEach((branch) => {
      branchColumnNames.forEach((columnName) => {
        const value = branch[columnName];
        if (value) {
          // Store by exact value
          branchLookups[columnName].set(String(value).trim(), branch);
          // Also store by lowercase for case-insensitive matching
          branchLookups[columnName].set(
            String(value).trim().toLowerCase(),
            branch,
          );
        }
      });
    });

    // Process each report to enrich with branch data (now using in-memory lookups)
    let successfulEnrichments = 0;
    const enrichedReports = reports.map((report) => {
      try {
        // Get primary field name and value from report
        let primaryFieldName = report.primary_field_name;
        let primaryFieldValue = report.primary_field_value;

        // If primary field value is missing, try to extract from content
        if (!primaryFieldValue && report.content) {
          try {
            const content =
              typeof report.content === "string"
                ? JSON.parse(report.content)
                : report.content;

            if (content.primaryField && content.primaryField.value) {
              primaryFieldValue = content.primaryField.value;
            }
          } catch (e) {
            // Silent fail for content parsing
          }
        }

        // Skip if we don't have the necessary data
        if (!primaryFieldName || !primaryFieldValue) {
          return report;
        }

        // Check if we have a lookup map for this primary field
        if (!branchLookups[primaryFieldName]) {
          return report;
        }

        // Try to find matching branch data using in-memory lookup
        const normalizedValue = String(primaryFieldValue).trim();
        let branchData = branchLookups[primaryFieldName].get(normalizedValue);

        // If not found, try case-insensitive match
        if (!branchData) {
          branchData = branchLookups[primaryFieldName].get(
            normalizedValue.toLowerCase(),
          );
        }

        if (!branchData) {
          return report;
        }

        // Merge branch data into report data
        // Prefix branch fields to avoid conflicts with report fields
        const prefixedBranchData = {};
        Object.keys(branchData).forEach((key) => {
          // Add branch_ prefix unless it's a common field we want to keep as-is
          const commonFields = [
            "id",
            "name",
            "code",
            "branch_name",
            "branch_code",
          ];
          if (commonFields.includes(key.toLowerCase())) {
            // For common fields, use branch_ prefix to avoid conflicts
            prefixedBranchData[`branch_${key}`] = branchData[key];
          } else {
            // For other fields, keep them as they are (they likely already have descriptive names)
            prefixedBranchData[key] = branchData[key];
          }
        });

        // DEBUG: Log if we're copying the problematic fields
        if (successfulEnrichments < 3) {
          const debugFields = ["brands_e_store_name", "order_number", "city"];
          const foundFields = debugFields.filter(
            (f) => prefixedBranchData[f] !== undefined,
          );
          if (foundFields.length > 0) {
          } else {
          }
        }

        // Create enriched report with branch data
        successfulEnrichments++;
        return {
          ...report,
          ...prefixedBranchData,
          // Explicitly set branch_matched: true to indicate successful enrichment
          branch_matched: true,
          branch_match_field: primaryFieldName,
          branch_match_value: primaryFieldValue,
        };
      } catch (error) {
        console.error(
          `Error enriching report ${report.id} with branch data:`,
          error,
        );
        // Return original report if enrichment fails
        return report;
      }
    });

    const duration = Date.now() - startTime;

    // DEBUG: Log enrichment failure details
    if (successfulEnrichments === 0 && reports.length > 0) {
      const firstReport = reports[0];
    } else if (successfulEnrichments < reports.length) {
    }

    return enrichedReports;
  } catch (error) {
    console.error("Error in enrichReportsWithBranchData:", error);
    // Return original reports if enrichment process fails
    return reports;
  }
};

module.exports = {
  saveReport,
  updateReport,
  getReports,
  getReportById,
  deleteReport,
  updateReportStatus,
  getClientDashboardData,
};
