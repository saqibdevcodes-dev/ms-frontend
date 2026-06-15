# Mystery Shopping Platform - Backend

A robust, scalable API server powering the Mystery Shopping platform.

## Overview

This backend application provides the core business logic and data management for the Mystery Shopping platform, enabling:

- Secure authentication and user management
- Report creation, storage, and retrieval
- Media file handling (images, videos, audio)
- Client and branch management
- Performance analytics and scoring

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for flexible data storage
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Multer** - Middleware for handling multipart/form-data
- **Sharp** - Image processing library
- **AWS SDK** - For S3 storage integration

## Installation

### Prerequisites

- Node.js (v14+)
- MongoDB (v4+)
- AWS S3 bucket (for media storage)

### Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd ms-bk
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:

   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/mystery-shopping
   JWT_SECRET=your_jwt_secret_key
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_BUCKET_NAME=your_s3_bucket_name
   ```

4. Start the server:

   ```bash
   npm start
   ```

   For development with auto-reload:

   ```bash
   npm run dev
   ```

## API Documentation

### Authentication

| Endpoint                  | Method | Description                    |
| ------------------------- | ------ | ------------------------------ |
| `/api/auth/login`         | POST   | User login                     |
| `/api/auth/register`      | POST   | Register new user (admin only) |
| `/api/auth/refresh-token` | POST   | Refresh authentication token   |
| `/api/auth/logout`        | POST   | User logout                    |

### Users

| Endpoint                  | Method | Description                   |
| ------------------------- | ------ | ----------------------------- |
| `/api/users`              | GET    | Get all users (admin only)    |
| `/api/users/:id`          | GET    | Get user by ID                |
| `/api/users/:id`          | PUT    | Update user                   |
| `/api/users/:id`          | DELETE | Delete user                   |
| `/api/users/:id/branches` | GET    | Get branches assigned to user |

### Clients

| Endpoint                    | Method | Description             |
| --------------------------- | ------ | ----------------------- |
| `/api/clients`              | GET    | Get all clients         |
| `/api/clients`              | POST   | Create new client       |
| `/api/clients/:id`          | GET    | Get client by ID        |
| `/api/clients/:id`          | PUT    | Update client           |
| `/api/clients/:id`          | DELETE | Delete client           |
| `/api/clients/:id/users`    | GET    | Get users for client    |
| `/api/clients/:id/branches` | GET    | Get branches for client |

### Branches

| Endpoint               | Method | Description                    |
| ---------------------- | ------ | ------------------------------ |
| `/api/branches`        | GET    | Get all branches               |
| `/api/branches`        | POST   | Create new branch              |
| `/api/branches/:id`    | GET    | Get branch by ID               |
| `/api/branches/:id`    | PUT    | Update branch                  |
| `/api/branches/:id`    | DELETE | Delete branch                  |
| `/api/branches/import` | POST   | Import branches from CSV/Excel |

### Reports

| Endpoint                        | Method | Description                |
| ------------------------------- | ------ | -------------------------- |
| `/api/reports`                  | GET    | Get all reports            |
| `/api/reports`                  | POST   | Create new report          |
| `/api/reports/:id`              | GET    | Get report by ID           |
| `/api/reports/:id`              | PUT    | Update report              |
| `/api/reports/:id`              | DELETE | Delete report              |
| `/api/reports/:id/approve`      | PUT    | Approve a report           |
| `/api/reports/:id/reject`       | PUT    | Reject a report            |
| `/api/reports/:id/media`        | GET    | Get all media for a report |
| `/api/reports/client/:clientId` | GET    | Get reports for client     |
| `/api/reports/export/:id`       | GET    | Export report (PDF/Excel)  |

### Media

| Endpoint                      | Method | Description                |
| ----------------------------- | ------ | -------------------------- |
| `/api/media/upload`           | POST   | Upload media file          |
| `/api/media/:id`              | GET    | Get media by ID            |
| `/api/media/:id`              | DELETE | Delete media               |
| `/api/media/report/:reportId` | GET    | Get all media for a report |

### Templates

| Endpoint             | Method | Description         |
| -------------------- | ------ | ------------------- |
| `/api/templates`     | GET    | Get all templates   |
| `/api/templates`     | POST   | Create new template |
| `/api/templates/:id` | GET    | Get template by ID  |
| `/api/templates/:id` | PUT    | Update template     |
| `/api/templates/:id` | DELETE | Delete template     |

## Architecture

### Data Models

- **User**: Authentication and authorization details
- **Client**: Organization data
- **Branch**: Store/location information
- **Report**: Mystery shopping assessment data
- **Media**: Links to images, videos, audio recordings
- **Template**: Reusable report structures
- **Form**: Dynamic form configurations

### Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Encrypted password storage

### File Storage

The application uses AWS S3 for storing media files:

- Images are resized and optimized before upload
- Videos are stored with appropriate content types
- Audio recordings are compressed when necessary
- Files are organized in buckets by client/report

## Development

### Code Structure

```
ms-bk/
├── config/                 # Configuration files
├── controllers/            # Request handlers
├── middleware/             # Express middleware
├── models/                 # Mongoose models
├── routes/                 # API routes
├── services/               # Business logic
├── utils/                  # Utility functions
├── uploads/                # Temporary file storage
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
└── server.js               # Application entry point
```

### Error Handling

The API uses a consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional information
  }
}
```

## Deployment

### Production Considerations

- Use environment variables for all sensitive configuration
- Set up proper logging (Winston/Morgan)
- Configure appropriate security headers
- Implement proper database indexing for performance
- Set up database backups
- Use a process manager (PM2) for Node.js

### Scaling

- Horizontal scaling with load balancing
- Database sharding for large datasets
- Caching layer (Redis) for frequently accessed data
- Separate media processing to worker processes

## License

Proprietary - All rights reserved
