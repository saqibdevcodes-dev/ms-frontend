# PDF URL Column Migration

This migration adds the `pdf_url` column to all client-specific reports tables in your database.

## How to Run the Migration

### Option 1: Using the API Endpoint (Recommended)

1. **Start your backend server** (if not already running):
   ```bash
   cd mystery-shopping-backend
   npm start
   # or
   node src/index.js
   ```

2. **Call the migration API endpoint**:
   
   **Using your browser:**
   - Make sure you're logged into your application
   - Navigate to: `http://localhost:3000/api/migrations/add-pdf-url`
   - (Replace `localhost:3000` with your backend URL)

   **Using curl:**
   ```bash
   curl -X GET http://localhost:3000/api/migrations/add-pdf-url \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

   **Using Postman/Thunder Client:**
   - Method: GET
   - URL: `http://localhost:3000/api/migrations/add-pdf-url`
   - Headers: Add your authentication token
   - Send the request

3. **Check the response:**
   ```json
   {
     "success": true,
     "message": "PDF URL migration completed successfully",
     "data": {
       "success": true,
       "added": 2,
       "alreadyExists": 0,
       "errors": 0,
       "total": 2
     }
   }
   ```

### Option 2: Using Direct SQL

If you have direct access to your MySQL database:

```sql
-- This will generate ALTER TABLE commands for all your client reports tables
SELECT CONCAT('ALTER TABLE `', TABLE_NAME, '` ADD COLUMN pdf_url TEXT AFTER timestamp_url;') AS sql_command
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME LIKE '%_reports';
```

Copy and execute each generated command in your MySQL client.

### Option 3: Run the Node.js Script Directly

If you have the database credentials configured in your `.env` file:

```bash
cd mystery-shopping-backend
node src/database/migrations/add_pdf_url_column_migration.js
```

## Rollback (if needed)

If you need to remove the `pdf_url` column:

**Using API:**
```
GET http://localhost:3000/api/migrations/rollback-pdf-url
```

**Using SQL:**
```sql
ALTER TABLE your_client_reports_table DROP COLUMN pdf_url;
```

## What This Migration Does

- Adds a `pdf_url` TEXT column to all client-specific reports tables
- Places the column after the `timestamp_url` column
- Skips tables where the column already exists
- Provides detailed feedback on the operation

## After Migration

Once the migration is complete, you can:
1. ✅ Create new reports with PDF URLs
2. ✅ Update existing reports with PDF URLs
3. ✅ Click the PDF button in the Media column to download PDFs
4. ✅ Use the "Export PDFs" button to export report PDFs

## Troubleshooting

**Error: "Unknown column 'pdf_url' in 'field list'"**
- This means the migration hasn't been run yet. Follow the steps above.

**Error: "Duplicate column name 'pdf_url'"**
- The column already exists. The error is harmless, but you can check with:
  ```sql
  SHOW COLUMNS FROM your_client_reports_table LIKE 'pdf_url';
  ```

**Connection Error:**
- Make sure your backend server is running
- Check your database credentials in `.env`
- Verify the database is accessible

## Need Help?

If you encounter any issues, check:
1. Backend server logs for detailed error messages
2. Database connection settings in `.env`
3. User permissions for ALTER TABLE operations




