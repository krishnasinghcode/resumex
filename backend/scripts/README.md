# Backend demo data scripts

These scripts create a complete demo candidate profile and a demo company with a sample job access code. They use `MONGO_URI` from `backend/.env` and can be rerun; rerunning updates the same demo records instead of creating duplicates.

## Run locally

Start MongoDB, then run these commands from the `backend/` directory:

```bash
npm run seed             # create/update both demo accounts and the sample job code
npm run seed:user        # create/update only the candidate and resume data
npm run seed:company     # create/update only the company and sample job code
npm run db:clear         # delete all collections in the configured resumex database
```

Demo logins:

| Account | Email | Password |
| --- | --- | --- |
| Candidate | `maya.shah@example.test` | `DemoUser123!` |
| Company | `talent@nimbuslabs.example.test` | `DemoCompany123!` |

The company seed prints the generated job access code after each run.

## Run with Docker Compose

From the project root, start the services first with `docker compose up -d`. Then run:

```bash
docker compose exec backend npm run seed
docker compose exec backend npm run seed:user
docker compose exec backend npm run seed:company
docker compose exec backend npm run db:clear
```

`db:clear` drops the entire configured database. It refuses to run with `NODE_ENV=production` and refuses database names that do not contain `resumex`.
