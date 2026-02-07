# Supabase Migrations Documentation

## Migration Structure

Migrations are organized into directories by date, following the format YYYY-MM-DD. Each migration contains SQL scripts that are responsible for modifying the database schema.

## Execution Order

Migrations are executed in chronological order. The migration system will apply all the migrations from the oldest to the newest, ensuring that your database is up-to-date with the latest schema changes.

## Table Descriptions

### Users Table

- **id**: Unique identifier for each user (UUID)
- **username**: Unique name for the user (String)
- **email**: User's email address (String)

### Cases Table

- **id**: Unique identifier for each case (UUID)
- **title**: Title of the case (String)
- **description**: Description of the case (Text)

## Views

Views are virtual tables defined by a query. They can be used to simplify complex queries.

### active_cases View

- Displays all cases that are currently open.

## RPC Functions

Remote Procedure Calls (RPCs) allow you to execute server-side functions directly from your application.

### fetch_user_cases

- **Description**: Fetches all cases related to a specific user.
- **Parameters**: user_id (UUID)

## Storage Bucket Configuration

The Supabase storage bucket is configured to hold various files related to your application. Make sure to configure permissions as necessary to control access.

## Verification Queries

To verify the migrations have been applied correctly, you can run the following queries:

```sql
SELECT * FROM information_schema.tables; -- Check all tables exist
SELECT * FROM active_cases; -- Verify active cases view
```

## Rollback Instructions

To rollback a migration, locate the corresponding migration file and reverse the SQL commands. Ensure you have backup copies of your data before proceeding with a rollback.

## Support Information

For further assistance, please refer to the documentation or contact support at support@example.com.

---

_Last Updated: 2026-01-19 03:00:52 UTC_
