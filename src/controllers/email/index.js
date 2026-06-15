const nodemailer = require("nodemailer");

async function sendInviteEmail(toEmail, data, inviteLink) {
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // Replace with your SMTP server
      port: 587, // For TLS
      secure: false, // true for 465, false for other ports
      service: "gmail",
      auth: {
        user: "waqasbaber581@gmail.com",
        pass: "waqas:420",
      },
    });

    // Email options
    const mailOptions = {
      from: '"Iris Communications" <waqasbaber581@gmail.com>', // Sender address
      to: toEmail, // List of receivers
      subject: "Iris Communications Invited You!", // Subject line
      html: `
        <h3>Hello,</h3>
        <p>You have been added to this ${data}. Please click the link below to accept the invitation:</p>
        <a href="${inviteLink}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
        <p>If the above button doesn't work, you can use the following link:</p>
        <p>${inviteLink}</p>
        <br/>
        <p>Best regards,</p>
        <p>Iris Communications</p>  
      `, // HTML content
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = {
    sendInviteEmail,
}

// Usage
// const inviteLink = "http://localhost:5173";
// sendInviteEmail("recipient@example.com", inviteLink);
