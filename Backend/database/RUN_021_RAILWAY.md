# Run 021 in Railway

1. Open **Railway → MySQL → Data**.
2. Open `migrations/021_railway_final_schema.sql`.
3. Run each `CREATE TABLE IF NOT EXISTS ...;` statement one at a time, from top to bottom.

Do not run any `ALTER TABLE users` statement. `users.role` is intentionally excluded.
