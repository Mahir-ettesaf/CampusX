# CampusX database setup

The backend reads its MySQL connection settings from `Backend/.env`:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Keep this file local and do not commit it.

## Fresh database

Create a new empty database using the name configured in `DB_NAME`. For example:

```sql
CREATE DATABASE campusx
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

Then apply the baseline schema from the `Backend` directory:

```bash
mysql -u <DB_USER> -p <DB_NAME> < database/schema.sql
```

The baseline schema creates the complete current `users` table, including the `graduate` role. A fresh database must not run `migrations/001_add_graduate_role.sql` afterward.

## Existing databases and migrations

Files in `database/migrations` are incremental changes for databases created before a given change. Apply a migration once, in numeric order, only when the database does not already contain that change.

`001_add_graduate_role.sql` is retained for an older existing database whose `users.role` enum does not include `graduate`. Do not run it on a fresh database created from `schema.sql`.

There is currently no migration runner. Apply reviewed migrations manually with MySQL and record which ones were applied in the deployment process.

## Current users table

`users` is the authentication table used by the existing backend. It contains:

| Column | Purpose |
| --- | --- |
| `id` | Auto-increment primary key. |
| `full_name` | Required user name, up to 100 characters. |
| `email` | Required unique login email, up to 100 characters. |
| `password` | Required bcrypt password hash, up to 255 characters. |
| `role` | Required enum: `student`, `graduate`, `faculty`, `recruiter`, or `admin`. |
| `profile_picture` | Optional profile-picture path or URL. |
| `is_verified` | Verification flag, defaulting to `0`. |
| `created_at` / `updated_at` | Creation and automatic update timestamps. |

The table uses InnoDB, `utf8mb4`, and `utf8mb4_0900_ai_ci`. Its primary key is `id`, and its `email` unique key prevents duplicate accounts.
