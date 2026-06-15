/**
 * PM2 Cache Flush Script
 * This script flushes PM2 process memory and restarts the application
 * Run this script directly with Node.js on your server when experiencing caching issues
 * Usage: node scripts/pm2-flush.js
 */

const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function flushPM2Cache() {
  console.log("📢 Starting PM2 memory flush...");

  try {
    // Get list of running PM2 processes
    const { stdout: listOutput } = await execPromise("pm2 list");
    console.log("Current PM2 processes:");
    console.log(listOutput);

    // Flush PM2 logs which can take up memory
    console.log("Flushing PM2 logs...");
    await execPromise("pm2 flush");
    console.log("✅ PM2 logs flushed");

    // Reload all applications (zero-downtime reload)
    console.log("Reloading all applications...");
    await execPromise("pm2 reload all");
    console.log("✅ All applications reloaded");

    // Get memory usage after restart
    const { stdout: statusOutput } = await execPromise("pm2 status");
    console.log("Updated PM2 status:");
    console.log(statusOutput);

    console.log("✅ PM2 memory flush completed successfully!");
    console.log(
      "👉 If you still experience caching issues, you may need to run:"
    );
    console.log("   pm2 stop all && pm2 delete all && pm2 start your-app.js");
  } catch (error) {
    console.error("❌ Error flushing PM2 memory:", error);
  } finally {
    process.exit(0);
  }
}

// Run the function
flushPM2Cache();
