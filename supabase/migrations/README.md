# Database Migrations

## File Structure

1. `######_initial_migration.sql`
2. `######_add_new_table.sql`
3. `######_update_existing_table.sql`
4. `######_drop_table.sql`
5. `######_add_index.sql`
6. `######_alter_column.sql`
7. `######_add_foreign_key.sql`
8. `######_create_view.sql`
9. `######_rpc_function.sql`

## Execution Order
Ensure the migrations are executed in the order listed above. Failure to do so may cause issues with dependencies.

## Methods to Run Migrations
1. **Supabase Dashboard:**
   - Go to the Migrations section and upload the migration files in the specified order.
2. **CLI:**
   - Use the Supabase CLI and run `supabase db push` command.
3. **PostgreSQL Script:**
   - Run the SQL files directly in your PostgreSQL client.

## Data Structure
### Database Tables
| Table Name     | Description             |
|----------------|-------------------------|
| `table_name_1` | Description of table 1  |
| `table_name_2` | Description of table 2  |
| ...            | ...                     |

### Views
| View Name      | Description             |
|----------------|-------------------------|
| `view_name_1`  | Description of view 1   |
| `view_name_2`  | Description of view 2   |
| ...            | ...                     |

### RPC Functions
| Function Name   | Description             |
|----------------|-------------------------|
| `function_name_1` | Description of function 1 |
| `function_name_2` | Description of function 2 |
| ...            | ...                     |

## Additional Configuration Steps for Storage Bucket
- Ensure that you have configured the bucket with proper permissions.
- Set up any necessary environment variables.

## Verification SQL Queries
- Run the following queries to verify the integrity and existence of your tables, views, and functions:
  ```sql
  SELECT * FROM information_schema.tables;
  SELECT * FROM information_schema.views;
  ```

## Important Notes
- Always make backups before running migrations.
- Ensure proper permissions are set for each table and function.
- Test migrations in a staging environment before running in production.

## Rollback Instructions
- To rollback a migration, revert the changes manually or use a pre-defined rollback file if available.

## Support
- For assistance, contact support@example.com or visit our support page.