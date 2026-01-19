# Supabase Migrations Documentation

## File Structure

The migrations are organized in the following structure:
```
supabase/
└── migrations/
    ├── [timestamp]_migration_name.sql  # SQL migration files  
    └── README.md  # This documentation  
```

## Execution Order

Migrations are executed in chronological order based on the timestamp prefix in their filenames. Ensure to follow strict naming conventions to maintain proper order during execution.

## Methods for Running Migrations

### 1. Supabase Dashboard
- Navigate to the Supabase project.
- Go to the 'Database' section and find the 'Migrations' tab.
- Use the interface to apply migrations manually.

### 2. CLI (Command Line Interface)
- Install Supabase CLI: `npm install -g supabase`  
- Run migrations using the command:  
  `supabase db push`  
- Ensure to be in the directory of your Supabase project.

### 3. PostgreSQL Script
- Connect to your PostgreSQL database using a SQL client.
- Execute the migration script:  
  `	iming on;`  
- Run the SQL migration file directly to apply changes.

## Data Structure

### Tables
- **Users Table**: Contains user information.
- **Cases Table**: Stores different case records.
  - `id`: Primary Key  
  - `description`: Text  
  - `status`: Enum (open, closed)

### Views
- **Active_Cases_View**: Shows all current open cases.

## RPC Function Examples with Usage

### Create_Case
- **Purpose**: To create a new case entry.  
- **Example Call**: `SELECT create_case('Description of the case');`
- **Returns**: Case ID of the newly created record.

### Get_Cases
- **Purpose**: Retrieves a list of cases.
- **Example Call**: `SELECT * FROM get_cases();`
- **Returns**: List of case records.

## Additional Configuration Steps for Storage Bucket
1. Navigate to the 'Storage' section in the Supabase dashboard.
2. Create a new bucket for storing files.
3. Configure permissions as necessary.

## Verification Queries
To verify your migrations, execute the following:
- Check tables: `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`
- Confirm data integrity: `SELECT * FROM cases WHERE status = 'open';`

## Important Notes
- **Backup**: Always back up your database before running migrations to avoid data loss.
- **Row-Level Security (RLS)**: Ensure RLS policies are defined for sensitive tables.

## Rollback Instructions
To rollback a migration:
1. Identify the migration to revert.
2. Execute the corresponding SQL script to undo changes made by the migration.

## Support Information
For assistance, contact the development team via email or reach out on the Saket Slack channel. Ensure to include the migration ID and relevant error messages if any issues arise.
