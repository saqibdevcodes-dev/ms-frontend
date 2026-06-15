# Backend Build & Deployment Guide

## Prerequisites
- Node.js (v14 or higher recommended)
- npm or yarn package manager

## Installation

Install all dependencies:
```bash
npm install
```

Or with yarn:
```bash
yarn install
```

## Available Scripts

### Development
```bash
npm run dev
```
Starts the backend in development mode with hot-reload using nodemon.

### Production
```bash
npm start
```
Starts the backend in production mode.

### Build
```bash
npm run build
```
Installs all dependencies (including devDependencies) for production build.

### Vercel Build
```bash
npm run vercel-build
```
Vercel-specific build command (no build step needed as this is a JavaScript project).

## Deployment

### Vercel Deployment
This backend is configured for Vercel deployment using the `vercel.json` configuration file.

**Deploy with Vercel CLI:**
```bash
vercel --prod
```

The Vercel configuration:
- Entry point: `src/index.js`
- Runtime: `@vercel/node`
- All routes are directed to the main index file

### Manual Deployment
For other hosting platforms:

1. Ensure environment variables are set (see `.env` file)
2. Install production dependencies:
   ```bash
   npm ci --production
   ```
3. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

Make sure to set the following environment variables in your deployment environment:
- `NODE_ENV` - Set to "production" for production deployments
- `FRONTEND_URL` - URL of your frontend application
- `EMAIL_FROM` - Email sender address
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_SECURE` - Use secure connection (true/false)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

Refer to the `.env` file for a complete list of required variables.

## Port Configuration

The backend listens on the port specified by the `PORT` environment variable, or defaults to `3000` if not set.

## Production Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] SMTP settings verified
- [ ] CORS origins updated for production domain
- [ ] SSL/TLS certificate configured (if self-hosting)
- [ ] Logs and monitoring set up
- [ ] Dependencies installed (`npm ci --production`)
