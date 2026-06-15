// Load environment variables
require("dotenv").config();

const { sendPasswordResetEmail } = require("./src/utils/mail");

async function testPasswordResetEmail() {
  try {
    console.log("Starting email test...");
    console.log("Using NODE_ENV:", process.env.NODE_ENV);
    console.log("Using SMTP_HOST:", process.env.SMTP_HOST);
    console.log("Using SMTP_PORT:", process.env.SMTP_PORT);
    console.log("Using SMTP_USER:", process.env.SMTP_USER);

    // We'll test with a sample token
    const resetToken = "testresettoken123456789abcdef";
    const recipientEmail = process.env.SMTP_USER || "test@example.com";

    console.log(`Sending test email to: ${recipientEmail}`);

    // Send the test email
    const result = await sendPasswordResetEmail(
      recipientEmail,
      resetToken,
      "Test User"
    );

    console.log("Email sent successfully!");
    console.log("Result:", result);

    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error("Failed to send test email:", error);
    process.exit(1);
  }
}

// Run the test
testPasswordResetEmail();
