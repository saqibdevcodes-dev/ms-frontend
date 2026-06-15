const jwt = require('jsonwebtoken');
const db = require('../database/sql');

async function authenticated(req, res, next) {
  try {
    // Extract token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: 'Authorization token is missing.' });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, "mystery_shopping_secret"); // Use your JWT secret
    } catch (err) {
      console.error('Invalid token:', err.message);
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    // Extract user ID from the decoded token
    const email = decoded.email;

    // Query the database for the user
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found.' });
    }

    // Attach the user and token to the request object for later use
    req.user = rows[0];
    req.accessToken = token;

    next(); // Call the next middleware or route handler
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = {
  authenticated
}
