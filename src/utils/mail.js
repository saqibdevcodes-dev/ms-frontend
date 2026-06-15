const nodemailer = require("nodemailer");

/**
 * Create a nodemailer transporter
 * @returns {Promise<nodemailer.Transporter>} - Nodemailer transporter
 */
const createTransporter = async () => {
  // In development, use Ethereal for testing
  if (process.env.NODE_ENV !== "production") {
    // Use Ethereal for testing
    const testAccount = await nodemailer.createTestAccount();
    console.log("Created Ethereal test account");

    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // In production, use configured SMTP server
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send a password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} name - User's name or email
 */
const sendPasswordResetEmail = async (to, resetToken, name = "") => {
  try {
    const transporter = await createTransporter();

    // Frontend URL (should be in ENV)
    const frontendUrl = "https://ms.iriscommunications.cloud";

    // Create reset URL - ensure it has the correct absolute path
    // Adding timestamp and direct params to avoid caching and routing issues
    const timestamp = Date.now();

    // Use absolute URL for localhost environments
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      to
    )}&t=${timestamp}&direct=true&source=email`;

    console.log(`Reset URL generated: ${resetUrl}`);

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"IRIS Support" <support@example.com>',
      to,
      subject: "Reset Your Password - IRIS Mystery Shopping",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="color: #334155; margin: 0;">Password Reset Request</h2>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Hello ${name || "there"},</p>
            <p>We received a request to reset your password for your IRIS Mystery Shopping account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Your Password</a>
            </div>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
            <p style="background-color: #f8fafc; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 14px;">${resetUrl}</p>
            <p style="margin-top: 30px; font-size: 14px; color: #64748b;">Regards,<br>The IRIS Mystery Shopping Team</p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      `,
    };

    console.log(`Attempting to send password reset email to: ${to}`);

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // For testing with Ethereal, log the preview URL
    if (process.env.NODE_ENV !== "production") {
      console.log("Password reset email sent:");
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } else {
      console.log("Password reset email sent successfully to", to);
      console.log("Message ID:", info.messageId);
    }

    return info;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

/**
 * Send a password reset confirmation email
 * @param {string} to - Recipient email address
 * @param {string} name - User's name or email
 */
const sendPasswordResetConfirmationEmail = async (to, name = "") => {
  try {
    const transporter = await createTransporter();

    // Frontend URL (should be in ENV)
    const frontendUrl = "https://ms.iriscommunications.cloud";

    // Login URL
    const loginUrl = `${frontendUrl}/`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"IRIS Support" <support@example.com>',
      to,
      subject: "Password Successfully Reset - IRIS Mystery Shopping",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="color: #334155; margin: 0;">Password Reset Successful</h2>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Hello ${name || "there"},</p>
            <p>Your password for your IRIS Mystery Shopping account has been successfully reset.</p>
            <p>You can now log in to your account with your new password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Login to Your Account</a>
            </div>
            <p>If you did not request this password change, please contact us immediately as your account may be compromised.</p>
            <p style="margin-top: 30px; font-size: 14px; color: #64748b;">Regards,<br>The IRIS Mystery Shopping Team</p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      `,
    };

    console.log(
      `Attempting to send password reset confirmation email to: ${to}`
    );

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // For testing with Ethereal, log the preview URL
    if (process.env.NODE_ENV !== "production") {
      console.log("Password reset confirmation email sent:");
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } else {
      console.log("Password reset confirmation email sent successfully to", to);
      console.log("Message ID:", info.messageId);
    }

    return info;
  } catch (error) {
    console.error("Error sending password reset confirmation email:", error);
    throw error;
  }
};

/**
 * Send account credentials to a user
 * @param {string} to - Recipient email address
 * @param {string} name - User's full name
 * @param {string} password - User's password
 */
const sendUserCredentialsEmail = async (to, name = "", password = "") => {
  try {
    const transporter = await createTransporter();

    // Frontend URL (should be in ENV)
    const frontendUrl = "https://ms.iriscommunications.cloud";

    // Login URL
    const loginUrl = `${frontendUrl}/`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"IRIS Support" <support@example.com>',
      to,
      subject: "Your IRIS Mystery Shopping Account Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="color: #334155; margin: 0;">Your Account Credentials</h2>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Hello ${name || "there"},</p>
            <p>Here are your login credentials for the IRIS Mystery Shopping platform:</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 5px 0;"><strong>Username/Email:</strong> ${to}</p>
              <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
            </div>
            
            <p>You can use these credentials to log in to the platform:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Login to Your Account</a>
            </div>
            
            <p>For security reasons, we recommend changing your password after your first login.</p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #64748b;">Regards,<br>The IRIS Mystery Shopping Team</p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      `,
    };

    console.log(`Attempting to send credentials email to: ${to}`);

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // For testing with Ethereal, log the preview URL
    if (process.env.NODE_ENV !== "production") {
      console.log("Credentials email sent:");
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } else {
      console.log("Credentials email sent successfully to", to);
      console.log("Message ID:", info.messageId);
    }

    return info;
  } catch (error) {
    console.error("Error sending credentials email:", error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendUserCredentialsEmail,
};
