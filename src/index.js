const apiRouter = require("./routes");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const cleanupService = require("./services/cleanupService");

// Load environment variables as early as possible
dotenv.config();

const app = express();

// Add compression middleware for faster response transfer (gzip)
try {
  const compression = require("compression");
  app.use(
    compression({
      level: 6, // Compression level (0-9, 6 is a good balance)
      threshold: 1024, // Only compress responses > 1KB
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );
  console.log("✅ Compression middleware enabled");
} catch (err) {
  console.log(
    "⚠️  Compression not available - install with: npm install compression",
  );
}

const allowedOrigins = [
  "http://localhost:5173",
  "https://ms.iriscommunications.cloud",
  "https://mss.iriscommunications.cloud",
  "https://ms-front-mu.vercel.app",
  "https://ms-frontend-test-9b21.vercel.app", // Fixed: removed trailing slash
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("Incoming Origin:", origin);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked Origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
// Explicitly handle preflight requests
app.options("*", cors(corsOptions));

// Increase JSON body parser limit to 50MB
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const PORT = process.env.PORT || 8000;

app.use("/api", apiRouter);

// Define the directory for your files
const filesDirectory = path.join(__dirname, "files");

// Endpoint to download a specific file
app.get("/download/:fileName", (req, res) => {
  const { fileName } = req.params;

  // Construct the full file path
  const filePath = path.join(filesDirectory, fileName);

  // Send the file for download
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error("Error during file download:", err.message);
      res.status(404).send("File not found!");
    }
  });
});

app.get("/", (request, res) => {
  res.json("server running");
});

app.get("/test", (request, res) => {
  res.json("server running too faast");
});

// Add a health check endpoint for monitoring
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cleanupService: cleanupService.getStatus(),
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Start the cleanup service to run every 15 minutes
  cleanupService.start(15);
  console.log(
    "Cleanup service started - will remove expired password reset tokens every 15 minutes",
  );
});
