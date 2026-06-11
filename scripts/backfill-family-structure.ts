import dotenv from "dotenv";
import pg from "pg";
import {
  buildChildUpsertStatement,
  buildFamilyBackfillPlan,
  buildFamilyMembershipStatement
} from "../src/lib/familyBackfill.ts";

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required to backfill family data.");
  process.exit(1);
}

const dryRun = !process.argv.includes("--apply");
const userIdFilter = readFlagValue("--user-id");
const limit = Number(readFlagValue("--limit") || "0") || null;

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
});

await main();

async function main() {
  try {
    await ensureFamilySchema(pool);

    const users = await loadUsers(pool, { userIdFilter, limit });
    if (users.length === 0) {
      console.log("No user_profile_state rows found. Nothing to backfill.");
      return;
    }

    let familiesCreated = 0;
    let familyMembersUpserted = 0;
    let childrenUpserted = 0;

    for (const user of users) {
      const stateRow = await loadUserProfileState(pool, user.id);
      if (!stateRow) continue;

      const plan = buildFamilyBackfillPlan(
        { id: user.id, fullName: user.full_name || "Родитель" },
        stateRow.state
      );

      if (plan.profiles.length === 0) {
        console.log(`[skip] ${user.email} has no profile data in user_profile_state.`);
        continue;
      }

      const existingFamily = await getOrCreateFamilyId(pool, user.id, plan.familyDisplayName, dryRun);
      const familyId = existingFamily.familyId;
      if (existingFamily.created) familiesCreated += 1;

      const memberUpserted = await ensureFamilyMember(pool, familyId, user.id, dryRun);
      if (memberUpserted) familyMembersUpserted += 1;

      for (const profile of plan.profiles) {
        const statement = buildChildUpsertStatement(familyId, profile);
        if (dryRun) {
          console.log(`[dry-run] children upsert for ${user.email}:`, {
            familyId,
            localChildId: profile.localChildId,
            name: profile.name,
            ageYears: profile.ageYears,
            diagnosticStatus: profile.diagnosticStatus,
            city: profile.city
          });
          childrenUpserted += 1;
          continue;
        }

        const result = await pool.query(statement.sql, statement.values);
        if (result.rowCount > 0) childrenUpserted += 1;
      }
    }

    console.log(
      `${dryRun ? "Dry run" : "Backfill complete"}: users=${users.length}, families=${familiesCreated}, family_members=${familyMembersUpserted}, children=${childrenUpserted}`
    );
  } finally {
    await pool.end();
  }
}

function readFlagValue(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

async function ensureFamilySchema(pool: pg.Pool) {
  const requiredTables = ["user_profile_state", "app_users", "families", "family_members", "children"];
  const tableRows = await pool.query<{
    table_name: string;
  }>(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'
       and table_name = any($1::text[])`,
    [requiredTables]
  );

  const foundTables = new Set(tableRows.rows.map(row => row.table_name));
  const missingTables = requiredTables.filter(tableName => !foundTables.has(tableName));
  if (missingTables.length > 0) {
    throw new Error(`Missing required tables: ${missingTables.join(", ")}`);
  }

  const uniqueRows = await pool.query<{ conname: string }>(
    `select conname
     from pg_constraint
     where conrelid = 'public.children'::regclass
       and contype = 'u'`
  );
  const uniqueNames = new Set(uniqueRows.rows.map(row => row.conname));
  if (!uniqueNames.has("children_family_id_local_child_id_key") && !uniqueNames.has("children_family_local_child_id_key")) {
    throw new Error("children must have a unique constraint on (family_id, local_child_id) before running the backfill.");
  }
}

async function loadUsers(
  pool: pg.Pool,
  options: { userIdFilter: string | null; limit: number | null }
) {
  const params: any[] = [];
  const where: string[] = [];

  if (options.userIdFilter) {
    params.push(options.userIdFilter);
    where.push(`app_users.id = $${params.length}`);
  }

  const limitClause = options.limit ? `limit ${Math.max(1, Math.trunc(options.limit))}` : "";
  const sql = `
    select app_users.id, app_users.email, app_users.full_name
    from user_profile_state
    join app_users on app_users.id = user_profile_state.user_id
    ${where.length ? `where ${where.join(" and ")}` : ""}
    order by app_users.created_at asc
    ${limitClause}
  `;

  const result = await pool.query(sql, params);
  return result.rows as Array<{ id: string; email: string; full_name: string }>;
}

async function loadUserProfileState(pool: pg.Pool, userId: string) {
  const result = await pool.query<{ state: any }>(
    "select state from user_profile_state where user_id = $1",
    [userId]
  );
  return result.rows[0] || null;
}

async function getOrCreateFamilyId(
  pool: pg.Pool,
  userId: string,
  displayName: string,
  dryRunMode: boolean
) {
  const existing = await pool.query<{ id: string }>(
    `select id
     from families
     where owner_user_id = $1
     order by created_at asc
     limit 1`,
    [userId]
  );

  if (existing.rows[0]) {
    return { familyId: existing.rows[0].id, created: false };
  }

  if (dryRunMode) {
    return { familyId: `dry-run-family-${userId}`, created: true };
  }

  const inserted = await pool.query<{ id: string }>(
    `insert into families (owner_user_id, display_name)
     values ($1, $2)
     returning id`,
    [userId, displayName]
  );
  return { familyId: inserted.rows[0].id, created: true };
}

async function ensureFamilyMember(pool: pg.Pool, familyId: string, userId: string, dryRunMode: boolean) {
  if (dryRunMode) return true;

  const statement = buildFamilyMembershipStatement(familyId, userId);
  const result = await pool.query(statement.sql, statement.values);
  return result.rowCount > 0;
}
