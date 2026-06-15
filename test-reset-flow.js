// Load environment variables
require("dotenv").config();

const axios = require("axios");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("./src/utils/mail");

// Test email - set this to your own email to receive the actual reset email
const testEmail = "contact@api-ids.iriscommunications.cloud";

// Base URL for the API
const apiBaseUrl = "http://localhost:8000/api";

// Step 1: Request a password reset
async function requestPasswordReset() {
  console.log(`\n==== STEP 1: Requesting password reset for ${testEmail} ====`);

  try {
    const response = await axios.post(`${apiBaseUrl}/auth/forgot-password`, {
      email: testEmail,
    });

    console.log("Response:", response.data);
    console.log(
      "\nNormally, the user would receive an email with a reset link."
    );
    console.log("Since we're testing, we'll generate our own reset token.");

    // Generate a test token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    console.log("\nGenerated test token:", resetToken);
    console.log("Token hash that would be stored in DB:", tokenHash);

    // Send a test email
    await sendTestResetEmail(resetToken);

    return resetToken;
  } catch (error) {
    console.error("Error requesting password reset:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
}

// Step 2: Send a test email with the reset link
async function sendTestResetEmail(resetToken) {
  console.log("\n==== STEP 2: Sending test reset email ====");

  try {
    // The frontend URL that hosts the reset form
    const frontendUrl = "https://ms.iriscommunications.cloud";

    // Create the reset URL that would be in the email
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      testEmail
    )}`;

    console.log("Reset URL that would be sent in email:", resetUrl);

    // Actually send a test email if you want to check your inbox
    const emailResult = await sendPasswordResetEmail(
      testEmail,
      resetToken,
      "Test User"
    );

    console.log(
      "\nEmail sent! Check your inbox or the console logs for the preview URL."
    );
    console.log("Message ID:", emailResult.messageId);

    return resetUrl;
  } catch (error) {
    console.error("Error sending test email:", error.message);
    throw error;
  }
}

// Step 3: Reset the password using the token
async function resetPassword(resetToken) {
  console.log("\n==== STEP 3: Resetting password with token ====");

  try {
    // New password to set
    const newPassword = "NewTestPassword123";

    console.log("Using token to reset password to:", newPassword);

    // Make the API request to reset the password
    const response = await axios.post(`${apiBaseUrl}/auth/reset-password`, {
      token: resetToken,
      email: testEmail,
      password: newPassword,
    });

    console.log("Response:", response.data);
    console.log(
      "\nPassword reset successful! The user can now log in with their new password."
    );
    console.log("New password:", newPassword);

    return true;
  } catch (error) {
    console.error("Error resetting password:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    return false;
  }
}

// Run the full test flow
async function runFullResetFlow() {
  console.log("===== TESTING PASSWORD RESET FLOW =====");

  try {
    // Step 1: Request a password reset
    const resetToken = await requestPasswordReset();

    console.log(
      "\nAt this point, the user would check their email and click the reset link."
    );
    console.log("The link would take them to the reset password page.");
    console.log(
      "\nPress Enter to continue to the next step (simulating user clicking the link and submitting the form)..."
    );

    // Wait for user to press Enter
    await new Promise((resolve) => {
      process.stdin.once("data", (data) => {
        resolve();
      });
    });

    // Step 3: Reset the password
    const success = await resetPassword(resetToken);

    if (success) {
      console.log("\n===== PASSWORD RESET FLOW COMPLETED SUCCESSFULLY =====");
    } else {
      console.log("\n===== PASSWORD RESET FLOW FAILED =====");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error in reset flow:", error);
    process.exit(1);
  }
}

// Start the test
runFullResetFlow();
