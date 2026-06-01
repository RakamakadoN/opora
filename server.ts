import express from "express";
import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import dotenv from "dotenv";
import { Pool } from "pg";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";

dotenv.config();

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "opora",
    environment: process.env.NODE_ENV || "development",
    database: postgresConfig() ? "postgres" : supabaseConfig() ? "supabase" : "local-json",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/db/status", async (_req, res) => {
  try {
    if (postgresConfig()) {
      const result = await pgQuery<{ now: string; requests: string }>(
        "select now()::text, (select count(*)::text from doctor_care_requests) as requests"
      );
      return res.json({
        ok: true,
        provider: "postgres",
        timestamp: result.rows[0]?.now,
        doctorCareRequests: Number(result.rows[0]?.requests || 0)
      });
    }
    if (supabaseConfig()) {
      return res.json({ ok: true, provider: "supabase" });
    }
    return res.json({ ok: true, provider: "local-json" });
  } catch (error: any) {
    res.status(500).json({ ok: false, provider: "postgres", error: error?.message || "database unavailable" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  if (requiresPersistentDatabase(res)) return;

  const email = normalizeEmail(String(req.body.email || ""));
  const password = String(req.body.password || "");
  const fullName = String(req.body.fullName || "Родитель").trim() || "Родитель";
  const role: AppRole = req.body.role === "doctor" ? "doctor" : "parent";

  if (!email.includes("@") || password.length < 8) {
    return res.status(400).json({ error: "Введите email и пароль минимум 8 символов." });
  }

  try {
    if (postgresConfig()) {
      const existing = await pgQuery("select id from app_users where email = $1", [email]);
      if (existing.rows[0]) return res.status(409).json({ error: "Такой email уже зарегистрирован." });
      const inserted = await pgQuery(
        `insert into app_users (email, full_name, role, password_hash)
         values ($1, $2, $3::app_role, $4)
         returning *`,
        [email, fullName, role, hashPassword(password)]
      );
      const user = publicUser(inserted.rows[0]);
      await createAuthSession(user.id, res);
      return res.status(201).json({ user, isNewUser: true });
    }

    const state = await readLocalAuthState();
    if (state.users.some(user => user.email === email)) {
      return res.status(409).json({ error: "Такой email уже зарегистрирован." });
    }
    const localUser = {
      id: randomUUID(),
      email,
      fullName,
      full_name: fullName,
      role,
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(password)
    };
    state.users.push(localUser as any);
    await writeLocalAuthState(state);
    const user = publicUser(localUser);
    await createAuthSession(user.id, res);
    res.status(201).json({ user, isNewUser: true });
  } catch (error: any) {
    console.error("Register API error:", error?.message || error);
    res.status(500).json({ error: "Не удалось создать аккаунт." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  if (requiresPersistentDatabase(res)) return;

  const email = normalizeEmail(String(req.body.email || ""));
  const password = String(req.body.password || "");

  try {
    if (postgresConfig()) {
      const result = await pgQuery("select * from app_users where email = $1 limit 1", [email]);
      const row = result.rows[0];
      if (!row || !verifyPassword(password, row.password_hash)) {
        return res.status(401).json({ error: "Неверный email или пароль." });
      }
      await pgQuery("update app_users set last_login_at = now() where id = $1", [row.id]);
      const user = publicUser(row);
      await createAuthSession(user.id, res);
      return res.json({ user });
    }

    const state = await readLocalAuthState();
    const found = state.users.find(user => user.email === email);
    if (!found || !verifyPassword(password, found.passwordHash)) {
      return res.status(401).json({ error: "Неверный email или пароль." });
    }
    const user = publicUser(found);
    await createAuthSession(user.id, res);
    res.json({ user });
  } catch (error: any) {
    console.error("Login API error:", error?.message || error);
    res.status(500).json({ error: "Не удалось войти." });
  }
});

app.get("/api/auth/me", async (req, res) => {
  if (requiresPersistentDatabase(res)) return;

  const user = await getAuthUserFromRequest(req);
  res.json({ user });
});

app.post("/api/auth/logout", async (req, res) => {
  if (requiresPersistentDatabase(res)) return;

  const token = getSessionToken(req);
  const tokenHash = token ? hashToken(token) : "";
  try {
    if (tokenHash && postgresConfig()) {
      await pgQuery("delete from auth_sessions where token_hash = $1", [tokenHash]);
    } else if (tokenHash) {
      const state = await readLocalAuthState();
      state.sessions = state.sessions.filter(session => session.tokenHash !== tokenHash);
      await writeLocalAuthState(state);
    }
  } catch (error: any) {
    console.warn("Logout cleanup failed:", error?.message || error);
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/profile-state", async (req, res) => {
  if (requiresPersistentDatabase(res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    if (postgresConfig()) {
      const result = await pgQuery("select state, updated_at from user_profile_state where user_id = $1", [user.id]);
      return res.json({ state: result.rows[0]?.state || null, updatedAt: result.rows[0]?.updated_at || null });
    }
    const state = await readLocalAuthState();
    res.json({ state: state.profileStates[user.id] || null, updatedAt: null });
  } catch (error: any) {
    console.error("Profile state read failed:", error?.message || error);
    res.status(500).json({ error: "profile_state_unavailable" });
  }
});

app.post("/api/profile-state", async (req, res) => {
  if (requiresPersistentDatabase(res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const statePayload = req.body?.state && typeof req.body.state === "object" ? req.body.state : {};
  try {
    if (postgresConfig()) {
      await pgQuery(
        `insert into user_profile_state (user_id, state, updated_at)
         values ($1, $2, now())
         on conflict (user_id)
         do update set state = excluded.state, updated_at = now()`,
        [user.id, JSON.stringify(statePayload)]
      );
      return res.json({ ok: true });
    }
    const state = await readLocalAuthState();
    state.profileStates[user.id] = statePayload;
    await writeLocalAuthState(state);
    res.json({ ok: true });
  } catch (error: any) {
    console.error("Profile state save failed:", error?.message || error);
    res.status(500).json({ error: "profile_state_save_failed" });
  }
});

type AppRole = "parent" | "doctor" | "admin";
type CareRequestStatus = "parent_requested" | "doctor_accepted" | "first_consult_done" | "full_access" | "declined";

type DoctorCareRequestApi = {
  id?: string;
  childId: string;
  childName: string;
  childAge: number;
  doctorId: number | string;
  doctorName: string;
  doctorTitle: string;
  doctorCity: string;
  requestedAt?: string;
  doctorAcceptedAt?: string;
  firstConsultAt?: string;
  parentConfirmedAt?: string;
  status: CareRequestStatus;
  parentNote?: string;
};

type AccessAuditLogApi = {
  id?: string;
  actorRole: AppRole;
  actorName: string;
  action: "request_created" | "doctor_accepted" | "first_consult_done" | "parent_confirmed_access" | "request_declined" | "booking_created" | "document_viewed";
  childId: string;
  doctorId?: number | string;
  requestId?: string;
  createdAt?: string;
  note: string;
};

type CareState = {
  doctorCareRequests: DoctorCareRequestApi[];
  accessAuditLogs: AccessAuditLogApi[];
};

type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  createdAt: string;
};

type AuthState = {
  users: Array<AuthUser & { passwordHash: string }>;
  sessions: Array<{
    id: string;
    userId: string;
    tokenHash: string;
    createdAt: string;
    expiresAt: string;
  }>;
  profileStates: Record<string, any>;
};

const runtimeStatePath = path.join(process.cwd(), "data", "runtime-care-state.json");
const runtimeAuthPath = path.join(process.cwd(), "data", "runtime-auth-state.json");

const defaultCareState = (): CareState => ({
  doctorCareRequests: [
    {
      id: "care-request-default-1",
      childId: "default-child-1",
      childName: "Алишер",
      childAge: 3,
      doctorId: 106,
      doctorName: "Даниил Ким",
      doctorTitle: "Детский особенный стоматолог, игровой терапевт",
      doctorCity: "Алматы",
      requestedAt: new Date().toISOString(),
      status: "parent_requested",
      parentNote: "Хотим сначала познакомиться и понять, подходит ли специалист ребенку."
    }
  ],
  accessAuditLogs: []
});

const readLocalCareState = async (): Promise<CareState> => {
  try {
    const raw = await readFile(runtimeStatePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      doctorCareRequests: Array.isArray(parsed.doctorCareRequests) ? parsed.doctorCareRequests : [],
      accessAuditLogs: Array.isArray(parsed.accessAuditLogs) ? parsed.accessAuditLogs : []
    };
  } catch {
    const initial = defaultCareState();
    await writeLocalCareState(initial);
    return initial;
  }
};

const writeLocalCareState = async (state: CareState) => {
  await mkdir(path.dirname(runtimeStatePath), { recursive: true });
  await writeFile(runtimeStatePath, JSON.stringify(state, null, 2), "utf8");
};

const readLocalAuthState = async (): Promise<AuthState> => {
  try {
    const raw = await readFile(runtimeAuthPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      profileStates: parsed.profileStates && typeof parsed.profileStates === "object" ? parsed.profileStates : {}
    };
  } catch {
    const initial: AuthState = { users: [], sessions: [], profileStates: {} };
    await writeLocalAuthState(initial);
    return initial;
  }
};

const writeLocalAuthState = async (state: AuthState) => {
  await mkdir(path.dirname(runtimeAuthPath), { recursive: true });
  await writeFile(runtimeAuthPath, JSON.stringify(state, null, 2), "utf8");
};

const requiresPersistentDatabase = (res: express.Response) => {
  if (!process.env.VERCEL || postgresConfig()) return false;

  res.status(503).json({
    error: "database_not_configured",
    message: "Production auth requires DATABASE_URL. Add the Supabase Postgres connection string in Vercel."
  });
  return true;
};

let pgPool: Pool | null = null;
let postgresReadyPromise: Promise<void> | null = null;

const postgresConfig = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  return {
    connectionString,
    ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
  };
};

const getPgPool = () => {
  const config = postgresConfig();
  if (!config) return null;
  if (!pgPool) {
    pgPool = new Pool({
      ...config,
      max: Number(process.env.PG_POOL_MAX || 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000
    });
  }
  return pgPool;
};

const ensurePostgresSchema = async () => {
  const pool = getPgPool();
  if (!pool) return;
  if (!postgresReadyPromise) {
    postgresReadyPromise = (async () => {
      const schemaPath = path.join(process.cwd(), "db", "railway-postgres.sql");
      const schema = await readFile(schemaPath, "utf8");
      await pool.query(schema);
    })();
  }
  await postgresReadyPromise;
};

const pgQuery = async <T = any>(sql: string, values: any[] = []) => {
  const pool = getPgPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");
  await ensurePostgresSchema();
  return pool.query<T>(sql, values);
};

const isUuid = (value?: string) => Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

const supabaseConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
};

const supabaseFetch = async (table: string, init: RequestInit = {}, query = "") => {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase is not configured");
  const response = await fetch(`${config.url}/rest/v1/${table}${query}`, {
    ...init,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {})
    }
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Supabase ${table} failed: ${response.status} ${text}`);
  }
  if (response.status === 204) return [];
  return response.json();
};

const requestFromDb = (row: any): DoctorCareRequestApi => ({
  id: row.id,
  childId: row.child_id,
  childName: row.child_name || row.child_id,
  childAge: row.child_age || 0,
  doctorId: row.doctor_external_id || row.doctor_id,
  doctorName: row.doctor_name || row.doctor_id,
  doctorTitle: row.doctor_title || "",
  doctorCity: row.doctor_city || "",
  requestedAt: row.requested_at,
  doctorAcceptedAt: row.doctor_accepted_at,
  firstConsultAt: row.first_consult_at,
  parentConfirmedAt: row.parent_confirmed_at,
  status: row.status,
  parentNote: row.parent_note || ""
});

const requestToDb = (request: DoctorCareRequestApi) => {
  const row: Record<string, any> = {
    child_id: request.childId,
    child_name: request.childName,
    child_age: request.childAge,
    doctor_external_id: Number(request.doctorId) || null,
    doctor_name: request.doctorName,
    doctor_title: request.doctorTitle,
    doctor_city: request.doctorCity,
    requested_at: request.requestedAt || new Date().toISOString(),
    doctor_accepted_at: request.doctorAcceptedAt || null,
    first_consult_at: request.firstConsultAt || null,
    parent_confirmed_at: request.parentConfirmedAt || null,
    status: request.status,
    parent_note: request.parentNote || null
  };
  if (isUuid(request.id)) row.id = request.id;
  return row;
};

const auditFromDb = (row: any): AccessAuditLogApi => ({
  id: row.id,
  actorRole: row.actor_role,
  actorName: row.actor_name || row.actor_role,
  action: row.action,
  childId: row.child_id,
  doctorId: row.doctor_external_id || row.doctor_id,
  requestId: row.request_id,
  createdAt: row.created_at,
  note: row.note
});

const auditToDb = (log: AccessAuditLogApi) => {
  const row: Record<string, any> = {
    actor_role: log.actorRole,
    actor_name: log.actorName,
    action: log.action,
    child_id: log.childId,
    doctor_external_id: Number(log.doctorId) || null,
    request_id: isUuid(log.requestId) ? log.requestId : null,
    created_at: log.createdAt || new Date().toISOString(),
    note: log.note
  };
  if (isUuid(log.id)) row.id = log.id;
  return row;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const hashToken = (token: string) => scryptSync(token, "opora-session-v1", 32).toString("hex");

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
};

const verifyPassword = (password: string, storedHash: string) => {
  const [, salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");
  return stored.length === candidate.length && timingSafeEqual(stored, candidate);
};

const publicUser = (row: any): AuthUser => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name || row.fullName || "Родитель",
  role: row.role || "parent",
  createdAt: row.created_at || row.createdAt || new Date().toISOString()
});

const parseCookies = (cookieHeader = "") => Object.fromEntries(
  cookieHeader
    .split(";")
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const index = part.indexOf("=");
      if (index === -1) return [part, ""];
      return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
    })
);

const setSessionCookie = (res: express.Response, token: string, expiresAt: Date) => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `opora_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Expires=${expiresAt.toUTCString()}${secure}`
  );
};

const clearSessionCookie = (res: express.Response) => {
  res.setHeader("Set-Cookie", "opora_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
};

const getSessionToken = (req: express.Request) => {
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies.opora_session || "";
};

const createAuthSession = async (userId: string, res: express.Response) => {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const sessionId = randomUUID();

  if (postgresConfig()) {
    await pgQuery(
      `insert into auth_sessions (id, user_id, token_hash, expires_at)
       values ($1, $2, $3, $4)`,
      [sessionId, userId, tokenHash, expiresAt.toISOString()]
    );
  } else {
    const state = await readLocalAuthState();
    state.sessions = [
      {
        id: sessionId,
        userId,
        tokenHash,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      },
      ...state.sessions.filter(session => new Date(session.expiresAt).getTime() > Date.now())
    ].slice(0, 500);
    await writeLocalAuthState(state);
  }

  setSessionCookie(res, token, expiresAt);
};

const getAuthUserFromRequest = async (req: express.Request): Promise<AuthUser | null> => {
  const token = getSessionToken(req);
  if (!token) return null;
  const tokenHash = hashToken(token);

  if (postgresConfig()) {
    const result = await pgQuery(
      `select app_users.*
       from auth_sessions
       join app_users on app_users.id = auth_sessions.user_id
       where auth_sessions.token_hash = $1
         and auth_sessions.expires_at > now()
       limit 1`,
      [tokenHash]
    );
    return result.rows[0] ? publicUser(result.rows[0]) : null;
  }

  const state = await readLocalAuthState();
  const session = state.sessions.find(item => item.tokenHash === tokenHash && new Date(item.expiresAt).getTime() > Date.now());
  if (!session) return null;
  const user = state.users.find(item => item.id === session.userId);
  return user ? publicUser(user) : null;
};

const requireAuth = async (req: express.Request, res: express.Response): Promise<AuthUser | null> => {
  const user = await getAuthUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "auth_required" });
    return null;
  }
  return user;
};

const listPostgresCareRequests = async (childId?: string) => {
  const result = childId
    ? await pgQuery(
      "select * from doctor_care_requests where child_id = $1 order by requested_at desc",
      [childId]
    )
    : await pgQuery("select * from doctor_care_requests order by requested_at desc");
  return result.rows.map(requestFromDb);
};

const insertPostgresCareRequest = async (request: DoctorCareRequestApi) => {
  const row = requestToDb(request);
  const result = await pgQuery(
    `insert into doctor_care_requests (
      child_id,
      child_name,
      child_age,
      doctor_external_id,
      doctor_name,
      doctor_title,
      doctor_city,
      requested_at,
      doctor_accepted_at,
      first_consult_at,
      parent_confirmed_at,
      status,
      parent_note
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::care_request_status, $13)
    returning *`,
    [
      row.child_id,
      row.child_name,
      row.child_age,
      row.doctor_external_id,
      row.doctor_name,
      row.doctor_title,
      row.doctor_city,
      row.requested_at,
      row.doctor_accepted_at,
      row.first_consult_at,
      row.parent_confirmed_at,
      row.status,
      row.parent_note
    ]
  );
  return requestFromDb(result.rows[0]);
};

const updatePostgresCareRequestStatus = async (id: string, patch: Partial<DoctorCareRequestApi>) => {
  if (!isUuid(id)) return undefined;
  const result = await pgQuery(
    `update doctor_care_requests
      set status = $2::care_request_status,
          doctor_accepted_at = coalesce($3::timestamptz, doctor_accepted_at),
          first_consult_at = coalesce($4::timestamptz, first_consult_at),
          parent_confirmed_at = coalesce($5::timestamptz, parent_confirmed_at)
      where id = $1
      returning *`,
    [id, patch.status, patch.doctorAcceptedAt || null, patch.firstConsultAt || null, patch.parentConfirmedAt || null]
  );
  return result.rows[0] ? requestFromDb(result.rows[0]) : undefined;
};

const insertPostgresAuditLog = async (log: AccessAuditLogApi) => {
  const row = auditToDb(log);
  const result = await pgQuery(
    `insert into access_audit_logs (
      actor_role,
      actor_name,
      action,
      child_id,
      doctor_external_id,
      request_id,
      created_at,
      note
    ) values ($1::app_role, $2, $3::audit_action, $4, $5, $6, $7, $8)
    returning *`,
    [
      row.actor_role,
      row.actor_name,
      row.action,
      row.child_id,
      row.doctor_external_id,
      row.request_id,
      row.created_at,
      row.note
    ]
  );
  return auditFromDb(result.rows[0]);
};

const listPostgresAuditLogs = async (childId?: string) => {
  const result = childId
    ? await pgQuery(
      "select * from access_audit_logs where child_id = $1 order by created_at desc",
      [childId]
    )
    : await pgQuery("select * from access_audit_logs order by created_at desc");
  return result.rows.map(auditFromDb);
};

const addAuditLog = async (log: AccessAuditLogApi) => {
  const payload = {
    ...log,
    id: log.id || `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: log.createdAt || new Date().toISOString()
  };

  if (postgresConfig()) {
    return insertPostgresAuditLog(payload).catch(async (error) => {
      console.warn("Audit Postgres write failed; using local fallback:", error?.message || error);
      const state = await readLocalCareState();
      state.accessAuditLogs = [payload, ...state.accessAuditLogs].slice(0, 200);
      await writeLocalCareState(state);
      return payload;
    });
  }

  if (supabaseConfig()) {
    const rows = await supabaseFetch("access_audit_logs", {
      method: "POST",
      body: JSON.stringify(auditToDb(payload))
    }).catch(async (error) => {
      console.warn("Audit Supabase write failed; using local fallback:", error?.message || error);
      const state = await readLocalCareState();
      state.accessAuditLogs = [payload, ...state.accessAuditLogs].slice(0, 200);
      await writeLocalCareState(state);
      return [payload];
    });
    return Array.isArray(rows) && rows[0] ? auditFromDb(rows[0]) : payload;
  }

  const state = await readLocalCareState();
  state.accessAuditLogs = [payload, ...state.accessAuditLogs].slice(0, 200);
  await writeLocalCareState(state);
  return payload;
};

app.get("/api/doctor-care/requests", async (req, res) => {
  const childId = String(req.query.childId || "");
  try {
    if (postgresConfig()) {
      const items = await listPostgresCareRequests(childId || undefined);
      return res.json({ items, source: "postgres" });
    }
    if (supabaseConfig()) {
      const query = childId
        ? `?child_id=eq.${encodeURIComponent(childId)}&order=requested_at.desc`
        : "?order=requested_at.desc";
      const rows = await supabaseFetch("doctor_care_requests", {}, query);
      return res.json({ items: rows.map(requestFromDb), source: "supabase" });
    }
    const state = await readLocalCareState();
    const items = childId ? state.doctorCareRequests.filter(item => item.childId === childId) : state.doctorCareRequests;
    res.json({ items, source: "local-json" });
  } catch (error: any) {
    console.error("Doctor care requests API error:", error?.message || error);
    res.status(500).json({ error: "doctor_care_requests unavailable" });
  }
});

app.post("/api/doctor-care/requests", async (req, res) => {
  const request: DoctorCareRequestApi = {
    ...req.body,
    id: req.body.id || `care-request-${Date.now()}`,
    requestedAt: req.body.requestedAt || new Date().toISOString(),
    status: req.body.status || "parent_requested"
  };
  try {
    let saved = request;
    if (postgresConfig()) {
      saved = await insertPostgresCareRequest(request);
    } else if (supabaseConfig()) {
      const rows = await supabaseFetch("doctor_care_requests", {
        method: "POST",
        body: JSON.stringify(requestToDb(request))
      });
      saved = requestFromDb(rows[0]);
    } else {
      const state = await readLocalCareState();
      state.doctorCareRequests = [saved, ...state.doctorCareRequests.filter(item => item.id !== saved.id)];
      await writeLocalCareState(state);
    }
    await addAuditLog({
      actorRole: "parent",
      actorName: "Родитель",
      action: "request_created",
      childId: saved.childId,
      doctorId: saved.doctorId,
      requestId: saved.id,
      note: `Родитель отправил запрос врачу ${saved.doctorName}.`
    });
    res.status(201).json(saved);
  } catch (error: any) {
    console.error("Create doctor care request API error:", error?.message || error);
    res.status(500).json({ error: "doctor_care_request create failed" });
  }
});

app.patch("/api/doctor-care/requests/:id/status", async (req, res) => {
  const id = req.params.id;
  const status = req.body.status as CareRequestStatus;
  const allowed: CareRequestStatus[] = ["parent_requested", "doctor_accepted", "first_consult_done", "full_access", "declined"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid care request status" });
  }

  const now = new Date().toISOString();
  const patch: Partial<DoctorCareRequestApi> = { status };
  if (status === "doctor_accepted") patch.doctorAcceptedAt = now;
  if (status === "first_consult_done") patch.firstConsultAt = now;
  if (status === "full_access") patch.parentConfirmedAt = now;

  try {
    let saved: DoctorCareRequestApi | undefined;
    if (postgresConfig()) {
      saved = await updatePostgresCareRequestStatus(id, patch);
    } else if (supabaseConfig() && isUuid(id)) {
      const dbPatch: Record<string, any> = { status };
      if (patch.doctorAcceptedAt) dbPatch.doctor_accepted_at = patch.doctorAcceptedAt;
      if (patch.firstConsultAt) dbPatch.first_consult_at = patch.firstConsultAt;
      if (patch.parentConfirmedAt) dbPatch.parent_confirmed_at = patch.parentConfirmedAt;
      const rows = await supabaseFetch("doctor_care_requests", {
        method: "PATCH",
        body: JSON.stringify(dbPatch)
      }, `?id=eq.${encodeURIComponent(id)}`);
      saved = requestFromDb(rows[0]);
    } else {
      const state = await readLocalCareState();
      state.doctorCareRequests = state.doctorCareRequests.map(item => {
        if (item.id !== id) return item;
        saved = { ...item, ...patch };
        return saved;
      });
      await writeLocalCareState(state);
    }

    if (!saved) return res.status(404).json({ error: "Care request not found" });

    const actionByStatus: Record<CareRequestStatus, AccessAuditLogApi["action"]> = {
      parent_requested: "request_created",
      doctor_accepted: "doctor_accepted",
      first_consult_done: "first_consult_done",
      full_access: "parent_confirmed_access",
      declined: "request_declined"
    };
    const actorRole: AppRole = status === "doctor_accepted" || status === "first_consult_done" ? "doctor" : "parent";
    const actorName = actorRole === "doctor" ? saved.doctorName : "Родитель";
    await addAuditLog({
      actorRole,
      actorName,
      action: actionByStatus[status],
      childId: saved.childId,
      doctorId: saved.doctorId,
      requestId: saved.id,
      note: status === "full_access"
        ? `Родитель открыл врачу ${saved.doctorName} полный доступ к документам ребенка.`
        : status === "doctor_accepted"
          ? "Врач принял запрос на первую консультацию."
          : status === "first_consult_done"
            ? "Врач отметил первую консультацию как проведенную."
            : status === "declined"
              ? `Запрос к врачу ${saved.doctorName} отклонен.`
              : `Создан запрос к врачу ${saved.doctorName}.`
    });

    res.json(saved);
  } catch (error: any) {
    console.error("Update doctor care request API error:", error?.message || error);
    res.status(500).json({ error: "doctor_care_request status update failed" });
  }
});

app.get("/api/access-audit-logs", async (req, res) => {
  const childId = String(req.query.childId || "");
  try {
    if (postgresConfig()) {
      const items = await listPostgresAuditLogs(childId || undefined);
      return res.json({ items, source: "postgres" });
    }
    if (supabaseConfig()) {
      const query = childId
        ? `?child_id=eq.${encodeURIComponent(childId)}&order=created_at.desc`
        : "?order=created_at.desc";
      const rows = await supabaseFetch("access_audit_logs", {}, query);
      return res.json({ items: rows.map(auditFromDb), source: "supabase" });
    }
    const state = await readLocalCareState();
    const items = childId ? state.accessAuditLogs.filter(item => item.childId === childId) : state.accessAuditLogs;
    res.json({ items, source: "local-json" });
  } catch (error: any) {
    console.error("Access audit logs API error:", error?.message || error);
    res.status(500).json({ error: "access_audit_logs unavailable" });
  }
});

type UsDirectoryPayload = {
  meta: Record<string, any>;
  providers: Record<string, any>[];
  treatmentApproaches: Record<string, any>[];
  clinicalTrials: Record<string, any>[];
};

let cachedUsDirectory: UsDirectoryPayload | null = null;
let cachedUsDirectoryAt = 0;

const loadUsDirectory = async (): Promise<UsDirectoryPayload> => {
  const cacheTtlMs = 10 * 60 * 1000;
  if (cachedUsDirectory && Date.now() - cachedUsDirectoryAt < cacheTtlMs) {
    return cachedUsDirectory;
  }

  const dataPath = path.join(process.cwd(), "data", "us-directory.generated.json");
  const raw = await readFile(dataPath, "utf8");
  cachedUsDirectory = JSON.parse(raw);
  cachedUsDirectoryAt = Date.now();
  return cachedUsDirectory;
};

app.get("/api/directory/us", async (req, res) => {
  try {
    const payload = await loadUsDirectory();
    const query = String(req.query.q || "").trim().toLowerCase();
    const state = String(req.query.state || "").trim().toUpperCase();
    const sourceKind = String(req.query.sourceKind || "").trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const filtered = payload.providers.filter((item) => {
      const matchesState = !state || item.state === state;
      const matchesSource = !sourceKind || item.sourceKind === sourceKind;
      const text = [
        item.name,
        item.title,
        item.desc,
        item.address,
        item.city,
        ...(item.tags || [])
      ].filter(Boolean).join(" ").toLowerCase();
      const matchesQuery = !query || text.includes(query);
      return matchesState && matchesSource && matchesQuery;
    });

    res.json({
      meta: payload.meta,
      total: filtered.length,
      limit,
      offset,
      items: filtered.slice(offset, offset + limit),
      treatmentApproaches: payload.treatmentApproaches,
      clinicalTrials: payload.clinicalTrials
    });
  } catch (error: any) {
    console.error("US directory API error:", error?.message || error);
    res.status(500).json({
      error: "US directory is unavailable",
      message: "Generated data file is missing or unreadable."
    });
  }
});

type PodcastEpisode = {
  id: string;
  title: string;
  summary: string;
  link: string;
  audioUrl: string;
  publishedAt: string;
  duration?: string;
};

const PODCAST_FEEDS = [
  {
    id: "vasia-in-space",
    title: "Vasia in space",
    feedUrl: "https://mavecloud.s3mts.ru/storage/feeds/37851.xml"
  }
];

let cachedPodcastFeeds: Record<string, PodcastEpisode[]> | null = null;
let cachedPodcastFeedsAt = 0;

const decodeXml = (value = "") => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, "\"")
  .replace(/&apos;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");

const stripHtml = (value = "") => decodeXml(value)
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const getXmlTag = (xml: string, tag: string) => {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
};

const parsePodcastFeed = (xml: string): PodcastEpisode[] => {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return items.map((item, index) => {
    const enclosure = item.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i);
    const audioUrl = enclosure ? decodeXml(enclosure[1]) : "";
    if (!audioUrl) return null;
    const title = getXmlTag(item, "itunes:title") || getXmlTag(item, "title") || `Выпуск ${index + 1}`;
    const rawSummary = getXmlTag(item, "itunes:summary") || getXmlTag(item, "description");
    return {
      id: `${title}-${index}`.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/(^-|-$)/g, ""),
      title: stripHtml(title),
      summary: stripHtml(rawSummary).slice(0, 280),
      link: getXmlTag(item, "link"),
      audioUrl,
      publishedAt: getXmlTag(item, "pubDate"),
      duration: getXmlTag(item, "itunes:duration")
    };
  }).filter(Boolean).slice(0, 8) as PodcastEpisode[];
};

app.get("/api/podcasts/ru", async (_req, res) => {
  const cacheTtlMs = 60 * 60 * 1000;
  if (cachedPodcastFeeds && Date.now() - cachedPodcastFeedsAt < cacheTtlMs) {
    return res.json({ feeds: cachedPodcastFeeds, updatedAt: new Date(cachedPodcastFeedsAt).toISOString() });
  }

  try {
    const feeds: Record<string, PodcastEpisode[]> = {};
    await Promise.all(PODCAST_FEEDS.map(async (feed) => {
      const response = await fetch(feed.feedUrl, { redirect: "follow" });
      if (!response.ok) throw new Error(`RSS ${feed.id} failed: ${response.status}`);
      feeds[feed.id] = parsePodcastFeed(await response.text());
    }));
    cachedPodcastFeeds = feeds;
    cachedPodcastFeedsAt = Date.now();
    res.json({ feeds, updatedAt: new Date(cachedPodcastFeedsAt).toISOString() });
  } catch (error: any) {
    console.error("Podcast RSS API error:", error?.message || error);
    res.status(500).json({ error: "Podcast RSS is unavailable", feeds: cachedPodcastFeeds || {} });
  }
});

// OpenRouter model rolling configuration
const OPENROUTER_FALLBACK_MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "qwen/qwen-2.5-7b-instruct:free",
  "deepseek/deepseek-r1:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-coder-32b-instruct:free"
];

const getOpenRouterClient = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://opora.kz",
      "X-Title": "Opora AI App",
    }
  });
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function callOpenRouterWithRoll(
  messages: Array<{ role: string; content: string }>,
  systemInstruction?: string,
  responseJson: boolean = false
): Promise<string> {
  const client = getOpenRouterClient();
  if (!client) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const formattedMessages: any[] = [];
  if (systemInstruction) {
    formattedMessages.push({ role: "system", content: systemInstruction });
  }
  
  messages.forEach(m => {
    formattedMessages.push({
      role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    });
  });

  let lastError: any = null;

  for (const model of OPENROUTER_FALLBACK_MODELS) {
    try {
      console.log(`[OpenRouter] Attempting to generate content using model: ${model}`);
      const options: any = {
        model: model,
        messages: formattedMessages,
        temperature: 0.6,
        max_tokens: responseJson ? 1600 : 1000,
      };

      if (responseJson) {
        options.response_format = { type: "json_object" };
      }

      const response = await withTimeout(
        client.chat.completions.create(options),
        8000,
        `OpenRouter model ${model}`
      );
      const content = response.choices?.[0]?.message?.content;
      
      if (content) {
        console.log(`[OpenRouter] Success generating response with model: ${model}`);
        return content;
      }
      throw new Error("Received empty response from OpenRouter API choice");
    } catch (err: any) {
      console.warn(`[OpenRouter] Model ${model} failed:`, err?.message || err);
      lastError = err;
      // Loop continues, rolling to next model
    }
  }

  throw new Error(`All OpenRouter fallback models failed. Last error: ${lastError?.message || lastError}`);
}

// Simple cache to prevent blowing through API limits
let cachedResearchNews: Record<string, unknown>[] | null = null;
let lastCacheTime = 0;

app.get("/api/research/latest", async (req, res) => {
  // Return cached result if generated within the last 12 hours
  if (cachedResearchNews && (Date.now() - lastCacheTime < 12 * 60 * 60 * 1000)) {
    return res.json(cachedResearchNews);
  }

  try {
    const prompt = `Поищи самые свежие и достоверные новости об исследованиях аутизма, методиках поддержки и социальной адаптации за последние 1-2 месяца из авторитетных американских медицинских источников (таких как CDC, NIH, AAP, Spectrum News / The Transmitter).
    
    Твоя задача — выбрать 3-4 самые важные новости и перевести их на русский язык для родителей особенных детей. Пиши очень тепло, с надеждой, понятным и бережным языком. Избегай пугающей медицинской терминологии, но сохраняй строгость доказательной медицины.
    
    Верни результат строго в формате JSON, представляющем массив объектов. Не добавляй никакого текста до или после JSON.
    Структура объекта:
    [
      {
        "id": "уникальный_короткий_id",
        "title": "Заголовок новости",
        "source": "Источник (напр. CDC, NIH)",
        "summary": "Короткий вывод для родителя (2-3 предложения)",
        "content": "Подробное, но простое описание новости на несколько абзацев. Пиши от лица чуткого компаньона.",
        "link": "Оригинальная ссылка на англоязычный источник для проверки"
      }
    ]`;

    let outputText = "[]";
    let geminiError: any = null;

    // 1. Try Gemini first if key exists
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
          }
        });
        outputText = response.text || "[]";
      } catch (e: any) {
        console.warn("Gemini Research API failed, will try OpenRouter fallback:", e?.message || e);
        geminiError = e;
      }
    }

    // 2. Try OpenRouter fallback with model rolling mechanism if Gemini was unconfigured or failed
    if ((!outputText || outputText === "[]" || geminiError) && process.env.OPENROUTER_API_KEY) {
      try {
        console.log("[Research API] Running OpenRouter model roll fallback...");
        outputText = await callOpenRouterWithRoll(
          [{ role: "user", content: prompt }],
          undefined,
          true
        );
      } catch (openRouterError: any) {
        console.error("OpenRouter Research fallback failed as well:", openRouterError?.message || openRouterError);
      }
    }

    if (!outputText || outputText === "[]") {
      throw new Error("No successful generation from any AI APIs.");
    }

    const cleanText = outputText.replace(/^```json\s*/m, "").replace(/```\s*$/m, "").trim();
    const parsedNews = JSON.parse(cleanText);
    
    cachedResearchNews = parsedNews;
    lastCacheTime = Date.now();
    
    res.json(parsedNews);

  } catch (error) {
    console.error("API Error fetching latest research:", error);
    // Fallback to static mock data if API limits are hit, so the parent can see the app working
    const fallbackNews = [
      {
        "id": "fallback_1",
        "title": "Раннее вмешательство меняет траекторию развития",
        "source": "CDC",
        "summary": "Доказано, что начало поведенческой терапии до 3 лет значительно улучшает навыки коммуникации.",
        "content": "В последних отчетах Центры по контролю и профилактике заболеваний США (CDC) вновь подчеркивают критическую важность раннего вмешательства (Early Intervention). Согласно новым данным, дети, начавшие получать помощь (АВА, логопед, эрготерапевт) в возрасте от 18 до 36 месяцев, показывают гораздо более высокую способность к интеграции в общеобразовательные учреждения в будущем.\n\nСамое главное для родителей: не ждите официального диагноза. Если вы видите задержки в развитии (например, отсутствие указательного жеста или реакции на имя), начинайте развивающие занятия уже сейчас.",
        "link": "https://www.cdc.gov/ncbddd/autism/treatment.html"
      },
      {
        "id": "fallback_2",
        "title": "Связь микробиома кишечника и аутизма",
        "source": "NIH",
        "summary": "Исследователи продолжают изучать, как состояние ЖКТ может влиять на поведение детей с РАС.",
        "content": "Национальные институты здравоохранения США (NIH) опубликовали обзор исследований о связи микробиома кишечника и аутизма. Доказано, что многие дети с РАС чаще испытывают проблемы с ЖКТ. \n\nХотя диеты (например, БГБК) не лечат сам аутизм, правильное питание и нормализация пищеварения могут существенно снизить тревожность, улучшить сон и уменьшить нежелательное поведение, так как ребенок перестает испытывать физический дискомфорт.",
        "link": "https://www.nichd.nih.gov/health/topics/autism/conditioninfo/treatments"
      }
    ];
    res.json(fallbackNews);
  }
});

app.post("/api/chat", async (req, res) => {
  const { messages, profile } = req.body;
  
  const systemInstruction = `Ты невероятно бережный, поддерживающий AI-компаньон для родителей детей с аутизмом в Казахстане. Твоя главная задача — давать ощущение безопасности и опоры, объяснять сложные термины простым языком, подсказывать шаги и оказывать глубокую эмоциональную поддержку.
  
Ты общаешься с родителем. 
Имя ребенка: ${profile?.childName || "ребенок"}, Возраст: ${profile?.childAge || "неизвестно"} лет. 
Актуальный этап пути: ${profile?.diagnosticStatus || "неизвестно"}. 
Город проживания: ${profile?.userCity || "Казахстан"}.

Правила поведения (ОЧЕНЬ ВАЖНО):
1. ПРИНЦИП МЯГКОЙ ВЕРОЯТНОСТИ И ЭТИКИ: Ты НЕ врач. Ты никогда не ставишь диагнозы и не используешь категоричные утверждения. Вместо жестких фраз ("обнаружен симптом", "это признак аутизма", "ему нужно") всегда используй мягкие, вероятностные формулировки: "возможно, стоит обратить внимание", "может быть полезно обсудить с врачом", "наблюдаются некоторые особенности", "иногда это может означать...". Мы даем ориентиры, а не вердикты.
2. Говори тепло, спокойно, с эмпатией. Используй фразы поддержки: "Я вас понимаю", "Это нормально чувствовать растерянность", "Мы с вами со всем разберемся". Называй родителя на "вы" с маленькой буквы.
3. Учитывай специфику Казахстана: ПМПК, КППК, Асыл Мирас и т.д.
4. Если родителю тяжело, страшно или он выгорел — отключи "режим советов" и просто дай ему максимальную словесную поддержку, валидацию чувств. Скажи, что он лучший родитель для своего ребенка.
5. Ответы: краткие, структурные (1-4 абзаца), поддерживающие.`;

  let replyText = "";
  let geminiError: any = null;

  // 1. Try Gemini first if key exists
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      interface ChatMessage {
        role: 'user' | 'assistant';
        content: string;
      }
      const contents = messages.map((m: ChatMessage) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.6,
        }
      });
      replyText = response.text || "";
    } catch (e: any) {
      console.warn("Gemini Chat failed, will try OpenRouter fallback:", e?.message || e);
      geminiError = e;
    }
  }

  // 2. Try OpenRouter fallback with model rolling mechanism if Gemini failed or was unconfigured
  if (!replyText && process.env.OPENROUTER_API_KEY) {
    try {
      console.log("[Chat API] Running OpenRouter model roll fallback...");
      replyText = await callOpenRouterWithRoll(
        messages,
        systemInstruction,
        false
      );
    } catch (openRouterError: any) {
      console.error("OpenRouter Chat fallback failed too:", openRouterError?.message || openRouterError);
    }
  }

  // 3. Output answer or fall back to high-quality local template
  if (replyText) {
    res.json({ reply: replyText });
  } else {
    console.warn("Both primary and fallback Chat APIs failed. Resorting to local response generator.");
    const fallbackReply = getFallbackChatResponse(messages[messages.length - 1]?.content || "", profile);
    res.json({ reply: fallbackReply });
  }
});

app.post("/api/doctor/chat", async (req, res) => {
  const { messages, childProfile, sensoryPassport, clinicalContext } = req.body;
  const directory = await loadUsDirectory().catch(() => null);
  const approaches = directory?.treatmentApproaches || [];
  const trials = directory?.clinicalTrials || [];
  const requestedLanguage = clinicalContext?.language === "kk"
    ? "Kazakh"
    : clinicalContext?.language === "en"
      ? "English"
      : "Russian";

  const evidenceBrief = [
    "Available evidence sources in this app:",
    ...approaches.map((item: any) => `- ${item.title}: ${item.summary} Source: ${item.sourceUrl}`),
    ...trials.slice(0, 5).map((item: any) => `- Clinical trial ${item.id}: ${item.title}; status ${item.status}; ${item.sourceUrl}`)
  ].join("\n");

  const systemInstruction = `You are Opora Clinician Assistant for licensed clinicians supporting autistic children and families.

Hard safety rules:
1. You are clinical decision support, not an autonomous doctor. Do not diagnose, prescribe, or replace local clinical judgment.
2. Do not claim there is a medication that treats core ASD symptoms. Medication may be discussed only for co-occurring symptoms and only with licensed supervision.
3. Prefer evidence-based, practical framing: behavioral/developmental interventions, speech therapy, occupational therapy, CBT for anxiety where appropriate, parent coaching, school supports, sleep/GI/epilepsy assessment when relevant.
4. Mention urgent referral only when there is risk: self-injury, aggression with danger, seizures, regression, dehydration, abuse/neglect risk, suicidal ideation, severe sleep collapse, medication adverse effects.
5. Answer in ${requestedLanguage}. Be concise, structured, and useful in clinic.
6. If asked for a treatment plan, call it an evidence-informed care plan: goals, supports, monitoring, follow-up, and safety. Avoid implying ASD is cured.
7. Use the parent-entered child progress and caregiver resource notes from clinicalContext when they are present.

Child card:
${JSON.stringify(childProfile || {}, null, 2)}

Sensory passport:
${JSON.stringify(sensoryPassport || {}, null, 2)}

Clinical context:
${JSON.stringify(clinicalContext || {}, null, 2)}

${evidenceBrief}`;

  let replyText = "";

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const contents = (messages || []).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents,
          config: {
            systemInstruction,
            temperature: 0.35,
            tools: [{ googleSearch: {} }]
          }
        }),
        3500,
        "Doctor Gemini assistant"
      );
      replyText = response.text || "";
    } catch (error: any) {
      console.warn("Doctor Gemini assistant failed:", error?.message || error);
    }
  }

  if (!replyText && process.env.OPENROUTER_API_KEY) {
    try {
      replyText = await withTimeout(
        callOpenRouterWithRoll(messages || [], systemInstruction, false),
        3500,
        "Doctor OpenRouter assistant"
      );
    } catch (error: any) {
      console.warn("Doctor OpenRouter assistant failed:", error?.message || error);
    }
  }

  if (!replyText) {
    const lastQuestion = String(messages?.[messages.length - 1]?.content || "").toLowerCase();
    const childName = childProfile?.childName || "ребенка";
    const age = childProfile?.childAge ? `${childProfile.childAge} лет` : "возраст не указан";
    const sensory = sensoryPassport?.comfortTriggers || "использовать короткие инструкции, паузы и предсказуемый порядок действий";
    const wantsPlan = lastQuestion.includes("план") || lastQuestion.includes("лечение") || lastQuestion.includes("care plan") || lastQuestion.includes("treatment");

    if (requestedLanguage === "English" && wantsPlan) {
      replyText = `Evidence-informed care plan for ${childProfile?.childName || "the child"} (${childProfile?.childAge || "age not specified"}):\n\n1. Goals for 8-12 weeks: define 2-3 functional goals with the family, such as communication, daily routines, sleep, and safer transitions.\n2. Supports: behavioral/developmental intervention, speech therapy, occupational therapy for sensory and daily living skills, parent coaching, and school supports.\n3. Monitoring: set a baseline, review weekly parent-entered child progress and caregiver stress, and adjust goals every 2-4 weeks.\n4. Medical review: assess sleep, GI discomfort, seizures/regression, anxiety, ADHD, and other co-occurring concerns when clinically relevant.\n5. Safety: urgent referral for self-injury, dangerous aggression, regression, seizures, dehydration, abuse/neglect risk, severe sleep collapse, or medication adverse effects.\n\nMedication should not be framed as treating core ASD symptoms; it can be discussed only for co-occurring symptoms under licensed supervision. Sources in the app: CDC ASD Treatment and ClinicalTrials.gov.`;
    } else if (requestedLanguage === "Kazakh" && wantsPlan) {
      replyText = `${childProfile?.childName || "бала"} үшін дәлелге сүйенген көмек жоспары (${childProfile?.childAge || "жасы көрсетілмеген"}):\n\n1. 8-12 апталық мақсат: отбасымен 2-3 нақты функционалдық мақсат белгілеу: коммуникация, күн тәртібі, ұйқы, ауысуларды қауіпсіз ету.\n2. Қолдау: behavioral/developmental тәсілдер, логопед, сенсорлық және күнделікті дағдылар үшін occupational therapy, ата-ананы үйрету, мектеп/балабақша қолдауы.\n3. Бақылау: бастапқы деңгей, ата-ана енгізген баланың прогресі мен ананың ресурсын апта сайын қарау, 2-4 апта сайын мақсатты түзету.\n4. Медициналық тексеру: ұйқы, ЖКТ жайсыздығы, ұстама/регресс, мазасыздық, ADHD және қосымша жағдайларды қажет болса бағалау.\n5. Қауіпсіздік: өзіне зиян, қауіпті агрессия, регресс, ұстама, сусыздану, зорлық қаупі, қатты ұйқы бұзылысы немесе дәрі жанама әсері болса шұғыл жолдау.\n\nДәрі core ASD symptoms емдейді деп айтылмайды; ол тек қосымша симптомдар үшін лицензиялы дәрігер бақылауымен талқыланады. Дереккөздер: CDC ASD Treatment және ClinicalTrials.gov.`;
    } else if (wantsPlan) {
      replyText = `Evidence-informed care plan для ${childName}, ${age}:\n\n1. Цели на 8-12 недель: выбрать с семьей 2-3 функциональные цели — коммуникация, рутина, сон, безопасные переходы, снижение перегрузок.\n2. Подходы помощи: behavioral/developmental interventions, логопед, OT для сенсорных и бытовых навыков, parent coaching, поддержка сада/школы.\n3. Мониторинг: baseline, еженедельные записи прогресса ребенка и ресурса мамы, пересмотр целей каждые 2-4 недели.\n4. Медицинская часть: при показаниях оценить сон, ЖКТ-дискомфорт, судороги/регресс, тревогу, ADHD и другие сопутствующие состояния.\n5. Безопасность: срочно направлять при самоагрессии, опасной агрессии, регрессе, судорогах, обезвоживании, риске насилия/пренебрежения, тяжелом срыве сна или побочных эффектах лекарств.\n\nВажно: медикаменты не подаются как лечение основных симптомов РАС; их обсуждают только для сопутствующих симптомов под очным наблюдением. Источники в базе: CDC ASD Treatment и ClinicalTrials.gov.`;
    } else if (lastQuestion.includes("сон") || lastQuestion.includes("sleep")) {
      replyText = `Клинически безопасный план для ${childName}, ${age}:\n\n1. Уточнить дневник сна 7-14 дней: время засыпания, ночные пробуждения, экран, боль/ЖКТ, судорожные эпизоды, храп.\n2. Начать с поведенческой гигиены сна и визуального расписания. Учитывать сенсорный паспорт: ${sensory}.\n3. Проверить частые причины: тревога, запор/рефлюкс, эпилептиформная активность при подозрении, побочные эффекты лекарств.\n4. Фармакологию обсуждать только очно и для сопутствующей проблемы сна, не как лечение core ASD symptoms.\n\nИсточники в базе: CDC ASD Treatment; ClinicalTrials.gov для исследований.`;
    } else if (lastQuestion.includes("aba") || lastQuestion.includes("терап")) {
      replyText = `Для ${childName}, ${age}, я бы оформил ответ как clinical support:\n\n1. Цель не “лечить аутизм”, а развивать коммуникацию, адаптивные навыки и снижать опасное/мешающее поведение.\n2. Рассмотреть behavioral approaches/ABA, speech therapy и occupational therapy по функциональным целям.\n3. Измерять прогресс: 2-3 конкретных навыка, baseline, частота/подсказки, перенос в дом/сад.\n4. Обязательно согласовать с семьей, избегать перегруза и учитывать сенсорный паспорт: ${sensory}.\n\nИсточник в базе: CDC ASD Treatment.`;
    } else {
      replyText = `Краткая clinical decision support заметка для ${childName}, ${age}:\n\n1. Сначала сформулировать конкретный вопрос: диагностика, сон, речь, поведение, тревога, школа или сенсорная адаптация.\n2. Опирайтесь на функциональные цели семьи и карточку ребенка, а не только на диагноз.\n3. Для помощи с доказательной базой: behavioral/developmental approaches, speech therapy, OT, CBT при тревоге; медикаменты только для сопутствующих симптомов под очным наблюдением.\n4. Сенсорная адаптация приема: ${sensory}.\n\nЭто не заменяет очную клиническую оценку.`;
    }
  }

  res.json({
    reply: replyText,
    evidence: {
      treatmentApproaches: approaches,
      clinicalTrials: trials
    }
  });
});

function getFallbackChatResponse(userMsg: string, profile: any): string {
  const query = userMsg.toLowerCase();
  if (query.includes('тяжело') || query.includes('устал') || query.includes('выгорел') || query.includes('страшно')) {
    return `Я вас слышу и очень хорошо понимаю. То, что вы чувствуете — это абсолютно нормально. Вы не робот, вы живой человек.\n\nПожалуйста, помните: вы замечательный родитель. Вы делаете для ${profile?.childName || "ребенка"} всё возможное. Постарайтесь найти хотя бы 10 минут только для себя, чтобы просто подышать в тишине. Вы нужны ${profile?.childName || "малышу"} здоровым и спокойным. (Квоты ИИ временно исчерпаны, но я вас обнимаю!)`;
  }
  if (query.includes('пмпк') || query.includes('диагноз') || query.includes('инвалидность') || query.includes('справк')) {
    return `Оформление документов — это всегда сложный и стрессовый этап. \n\nВ Казахстане первый шаг — это обращение к участковому педиатру и детскому психиатру по месту жительства. Психиатр собирает комиссию, после чего направляет вас на ПМПК (Психолого-медико-педагогическая консультация) для получения заключения об образовательном маршруте. \n\nВсе государственные кабинеты коррекции (КППК) принимают именно по направлению от ПМПК. Сил вам на этом пути!`;
  }
  if (query.includes('aba') || query.includes('аба') || query.includes('заняти') || query.includes('терапия')) {
    return `АВА-терапия (прикладной анализ поведения) считается одним из самых эффективных методов с доказанной базой.\n\nВ Казахстане можно получить бесплатную помощь в центрах "Асыл Мирас" (Фонд Булата Утемуратова), они есть в крупных городах. Вы также можете встать в очередь в государственный кабинет коррекции (КППК) через портал после заключения ПМПК.`;
  }
  
  return `Я вас очень внимательно слушаю. К сожалению, сейчас у меня временные технические трудности с доступом к облачной нейросети (квоты исчерпаны).\n\nПожалуйста, посмотрите разделы "Справочник" или "База знаний" в этом приложении — там собрана проверенная информация по центрам и статьям в Казахстане. Я скоро вернусь в строй!`;
}

export async function startServer() {
  if (postgresConfig()) {
    try {
      await ensurePostgresSchema();
      console.log("Postgres schema is ready.");
    } catch (error: any) {
      console.error("Postgres schema initialization failed:", error?.message || error);
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
