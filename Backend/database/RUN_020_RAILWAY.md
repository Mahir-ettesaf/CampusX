# Run migration 020 in Railway

In Railway **Database → Data**, run this statement once first. The confirmed
Railway `users` table has no `role` column:

```sql
ALTER TABLE users ADD COLUMN role ENUM('student','graduate','faculty','recruiter','admin') NOT NULL DEFAULT 'student' AFTER password;
```

Then open `migrations/020_railway_data_editor_safe_schema.sql` and run each
`CREATE TABLE IF NOT EXISTS ...;` statement individually, from top to bottom.
They are safe to repeat. If the role statement reports that `role` already
exists, do not run it again; continue with the table statements.

Existing accounts are preserved. If any existing account should be faculty,
recruiter, or admin, assign that role deliberately after the schema setup.
