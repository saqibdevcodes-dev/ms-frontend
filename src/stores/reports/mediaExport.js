const JSZip = require("jszip");
const FileSaver = require("file-saver");
const path = require("path");
const { Toast } = require("../../utils/toast");

/**
 * Extract media URLs from a report's content
 * @param {Object} report - The report object
 * @param {string} mediaType - The type of media to extract ('images', 'videos', 'audios')
 * @returns {Array} Array of media objects with urls and metadata
 */
const extractMediaFromReport = (report, mediaType) => {
  const mediaItems = [];

  try {
    // If report has no content, return empty array
    if (!report.content || !report.content.reports) {
      return mediaItems;
    }

    // Client domain for constructing full URLs
    const clientDomain = report.domain_name || "";

    // Extract media from each section's data
    report.content.reports.forEach((section, sectionIndex) => {
      if (!section.data) return;

      section.data.forEach((item, itemIndex) => {
        // Check for the specific media type
        if (
          item[mediaType] &&
          Array.isArray(item[mediaType]) &&
          item[mediaType].length > 0
        ) {
          item[mediaType].forEach((media, mediaIndex) => {
            // Build a descriptive filename
            const mediaName =
              media.name ||
              `${mediaType.slice(
                0,
                -1
              )}_${sectionIndex}_${itemIndex}_${mediaIndex}`;
            const sanitizedMediaName = mediaName.replace(
              /[^a-zA-Z0-9_\-\.]/g,
              "_"
            );

            // Add domain to url if it's a relative path and domain is available
            let mediaUrl = media.url;
            if (mediaUrl && !mediaUrl.startsWith("http") && clientDomain) {
              mediaUrl = `https://${clientDomain}${
                mediaUrl.startsWith("/") ? "" : "/"
              }${mediaUrl}`;
            }

            if (mediaUrl) {
              mediaItems.push({
                url: mediaUrl,
                name: sanitizedMediaName,
                title: media.title || media.name || "",
                section: section.heading || `Section ${sectionIndex + 1}`,
                question: item.question || `Question ${itemIndex + 1}`,
                extension:
                  path.extname(mediaUrl) || getDefaultExtension(mediaType),
              });
            }
          });
        }
      });
    });

    return mediaItems;
  } catch (error) {
    console.error(`Error extracting ${mediaType} from report:`, error);
    return mediaItems;
  }
};

/**
 * Get default file extension based on media type
 * @param {string} mediaType - The type of media
 * @returns {string} Default file extension
 */
const getDefaultExtension = (mediaType) => {
  switch (mediaType) {
    case "images":
      return ".jpg";
    case "videos":
      return ".mp4";
    case "audios":
      return ".mp3";
    default:
      return ".bin";
  }
};

/**
 * Generate a valid filename
 * @param {Object} report - The report object
 * @param {string} mediaType - Type of media being exported
 * @returns {string} A sanitized filename
 */
const generateFilename = (report, mediaType) => {
  let baseName = "Report";

  if (report.template_name) {
    baseName = report.template_name;
  } else if (report.id) {
    baseName = `Report_${report.id}`;
  }

  // Sanitize the filename
  baseName = baseName.replace(/[/\\?%*:|"<>]/g, "_");

  return `${baseName}_${mediaType}`;
};

/**
 * Fetch a media file and return as blob
 * @param {string} url - URL of the media file
 * @returns {Promise<Blob>} The media file as a blob
 */
const fetchMediaAsBlob = async (url) => {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch media: ${response.status} ${response.statusText}`
      );
    }

    return await response.blob();
  } catch (error) {
    console.error("Error fetching media file:", error);
    throw error;
  }
};

/**
 * Export media from a single report
 * @param {Object} report - The report object
 * @param {string} mediaType - Type of media to export ('images', 'videos', 'audios')
 */
const exportMediaFromSingleReport = async (report, mediaType) => {
  try {
    Toast.info(`Preparing ${mediaType} export...`);

    // Extract media from the report
    const mediaItems = extractMediaFromReport(report, mediaType);

    if (mediaItems.length === 0) {
      Toast.info(`No ${mediaType} found in this report.`);
      return;
    }

    // If only one media file, download directly
    if (mediaItems.length === 1) {
      const media = mediaItems[0];
      const blob = await fetchMediaAsBlob(media.url);
      const filename = `${media.name}${media.extension}`;

      FileSaver.saveAs(blob, filename);
      Toast.success(`${mediaType} exported successfully.`);
      return;
    }

    // For multiple media files, create a zip
    const zip = new JSZip();
    const zipFilename = `${generateFilename(report, mediaType)}.zip`;

    // Create a folder for the report media
    const mediaFolder = zip.folder(mediaType);

    // Add a README file with media information
    let readme = `# ${mediaType.toUpperCase()} from ${
      report.template_name || "Report"
    }\n\n`;
    readme += `Date: ${new Date().toLocaleDateString()}\n`;
    readme += `Total ${mediaType}: ${mediaItems.length}\n\n`;
    readme += `## Media Files\n\n`;

    // Add each media file to the zip
    for (let i = 0; i < mediaItems.length; i++) {
      const media = mediaItems[i];
      const filename = `${media.name}${media.extension}`;

      Toast.info(`Processing ${mediaType} ${i + 1} of ${mediaItems.length}...`);

      try {
        const blob = await fetchMediaAsBlob(media.url);
        mediaFolder.file(filename, blob);

        // Add media info to readme
        readme += `### ${i + 1}. ${media.name}\n`;
        readme += `- Section: ${media.section}\n`;
        readme += `- Question: ${media.question}\n`;
        readme += `- Filename: ${filename}\n\n`;
      } catch (error) {
        console.error(`Failed to add ${filename} to zip:`, error);
        readme += `### ${i + 1}. ${media.name} (FAILED TO DOWNLOAD)\n`;
        readme += `- Section: ${media.section}\n`;
        readme += `- Question: ${media.question}\n`;
        readme += `- URL: ${media.url}\n`;
        readme += `- Error: ${error.message}\n\n`;
      }
    }

    // Add the readme file
    mediaFolder.file("README.md", readme);

    // Generate and save the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(zipBlob, zipFilename);

    Toast.success(`${mediaType} exported successfully as ${zipFilename}`);
  } catch (error) {
    console.error(`Error exporting ${mediaType}:`, error);
    Toast.error(`Failed to export ${mediaType}: ${error.message}`);
  }
};

/**
 * Export media from multiple reports
 * @param {Array} reports - Array of report objects
 * @param {string} mediaType - Type of media to export ('images', 'videos', 'audios')
 */
const exportMediaFromMultipleReports = async (reports, mediaType) => {
  try {
    Toast.info(
      `Preparing ${mediaType} export from ${reports.length} reports...`
    );

    // Create a zip file
    const zip = new JSZip();
    const dateString = new Date().toISOString().split("T")[0];
    const zipFilename = `Mystery_Shopping_${mediaType}_${dateString}.zip`;

    let totalMediaCount = 0;
    let successfulExports = 0;

    // Process each report
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      Toast.info(`Processing report ${i + 1} of ${reports.length}...`);

      // Extract media from the report
      const mediaItems = extractMediaFromReport(report, mediaType);
      totalMediaCount += mediaItems.length;

      if (mediaItems.length === 0) {
        continue; // Skip reports with no media
      }

      // Create a folder for this report
      const reportName = (
        report.template_name || `Report_${report.id || i + 1}`
      ).replace(/[/\\?%*:|"<>]/g, "_");
      const reportFolder = zip.folder(reportName);

      // Add a README file with report information
      let readme = `# ${reportName} - ${mediaType.toUpperCase()}\n\n`;
      readme += `Date: ${new Date().toLocaleDateString()}\n`;
      readme += `Total ${mediaType}: ${mediaItems.length}\n\n`;
      readme += `## Media Files\n\n`;

      // Add each media file to the report folder
      for (let j = 0; j < mediaItems.length; j++) {
        const media = mediaItems[j];
        const filename = `${media.name}${media.extension}`;

        try {
          const blob = await fetchMediaAsBlob(media.url);
          reportFolder.file(filename, blob);
          successfulExports++;

          // Add media info to readme
          readme += `### ${j + 1}. ${media.name}\n`;
          readme += `- Section: ${media.section}\n`;
          readme += `- Question: ${media.question}\n`;
          readme += `- Filename: ${filename}\n\n`;
        } catch (error) {
          console.error(`Failed to add ${filename} to zip:`, error);
          readme += `### ${j + 1}. ${media.name} (FAILED TO DOWNLOAD)\n`;
          readme += `- Section: ${media.section}\n`;
          readme += `- Question: ${media.question}\n`;
          readme += `- URL: ${media.url}\n`;
          readme += `- Error: ${error.message}\n\n`;
        }
      }

      // Add the readme file to the report folder
      reportFolder.file("README.md", readme);
    }

    if (totalMediaCount === 0) {
      Toast.info(`No ${mediaType} found in the selected reports.`);
      return;
    }

    // Add a main README file with summary
    let mainReadme = `# ${mediaType.toUpperCase()} Export Summary\n\n`;
    mainReadme += `Date: ${new Date().toLocaleDateString()}\n`;
    mainReadme += `Reports processed: ${reports.length}\n`;
    mainReadme += `Total ${mediaType} found: ${totalMediaCount}\n`;
    mainReadme += `Successfully exported: ${successfulExports}\n\n`;
    mainReadme += `## Reports\n\n`;

    reports.forEach((report, index) => {
      const reportName = (
        report.template_name || `Report_${report.id || index + 1}`
      ).replace(/[/\\?%*:|"<>]/g, "_");
      const mediaCount = extractMediaFromReport(report, mediaType).length;
      mainReadme += `- ${reportName}: ${mediaCount} ${mediaType}\n`;
    });

    zip.file("README.md", mainReadme);

    // Generate and save the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(zipBlob, zipFilename);

    Toast.success(`${mediaType} exported successfully as ${zipFilename}`);
  } catch (error) {
    console.error(`Error exporting ${mediaType} from multiple reports:`, error);
    Toast.error(`Failed to export ${mediaType}: ${error.message}`);
  }
};

module.exports = {
  exportImages: (report) => exportMediaFromSingleReport(report, "images"),
  exportVideos: (report) => exportMediaFromSingleReport(report, "videos"),
  exportAudios: (report) => exportMediaFromSingleReport(report, "audios"),
  exportMultipleImages: (reports) =>
    exportMediaFromMultipleReports(reports, "images"),
  exportMultipleVideos: (reports) =>
    exportMediaFromMultipleReports(reports, "videos"),
  exportMultipleAudios: (reports) =>
    exportMediaFromMultipleReports(reports, "audios"),
};
