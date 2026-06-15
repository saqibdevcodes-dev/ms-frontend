/**
 * CleanupService - Handles periodic cleanup tasks in the system
 *
 * This service is responsible for cleaning up expired records including:
 * - Password reset tokens
 * - Temporary files
 * - Old log entries
 */

const db = require("../database/sql");
const logger = console; // Replace with proper logger in production

class CleanupService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
  }

  /**
   * Start the cleanup service with the specified interval
   * @param {number} intervalMinutes - Interval in minutes between cleanup runs
   */
  start(intervalMinutes = 60) {
    if (this.isRunning) {
      logger.info("Cleanup service is already running");
      return;
    }

    logger.info(
      `Starting cleanup service to run every ${intervalMinutes} minutes`
    );

    // Run once immediately
    this.cleanup();

    // Schedule regular runs
    this.interval = setInterval(() => {
      this.cleanup();
    }, intervalMinutes * 60 * 1000);

    this.isRunning = true;
  }

  /**
   * Stop the cleanup service
   */
  stop() {
    if (!this.isRunning) {
      logger.info("Cleanup service is not running");
      return;
    }

    clearInterval(this.interval);
    this.interval = null;
    this.isRunning = false;

    logger.info("Cleanup service stopped");
  }

  /**
   * Run all cleanup tasks
   */
  async cleanup() {
    logger.info("Running cleanup tasks...");

    try {
      const results = await Promise.allSettled([
        this.cleanupExpiredResetTokens(),
        // Add more cleanup tasks here as needed
        // this.cleanupTemporaryFiles(),
        // this.cleanupOldLogs()
      ]);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          logger.error(`Cleanup task #${index} failed:`, result.reason);
        }
      });

      logger.info("Cleanup tasks completed");
    } catch (error) {
      logger.error("Error running cleanup tasks:", error);
    }
  }

  /**
   * Clean up expired password reset tokens
   */
  async cleanupExpiredResetTokens() {
    logger.info("Cleaning up expired password reset tokens...");

    try {
      const [result] = await db.query(
        "DELETE FROM password_reset_tokens WHERE expires_at < NOW()"
      );

      logger.info(
        `Removed ${result.affectedRows} expired password reset tokens`
      );
      return result.affectedRows;
    } catch (error) {
      logger.error("Error cleaning up expired password reset tokens:", error);
      throw error;
    }
  }

  /**
   * Get the current status of the cleanup service
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun || null,
      nextRun: this.isRunning
        ? new Date(Date.now() + this.interval._idleTimeout)
        : null,
    };
  }
}

// Create a singleton instance
const cleanupService = new CleanupService();

module.exports = cleanupService;
