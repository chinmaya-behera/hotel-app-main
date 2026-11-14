# Identity schema migration

The Drizzle journal starts with `0000_tearful_retro_girl.sql`, the baseline already recorded in production. The next migration, `0001_identity.sql`, updates constraints on the 16 Domain 1 tables and restores four decimal places for financial limits.

Set `DATABASE_URL` to the intended direct PostgreSQL connection. From `public-preview`, run:

```sh
npm run db:migrate
```

Older databases provisioned from `0000_clean_stingray.sql` or the earlier UUID schema need their baseline reconciled before applying this journal. Check `drizzle.__drizzle_migrations` before migrating an existing database. The expected first entry has timestamp `1794596861484`.

The identity migration validates existing rows as it adds constraints. Resolve any reported invalid rows before retrying. Subsequent changes to operations and finance have their own migration scope.
