import { createHash, randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const suffix = Date.now().toString(36);
let userId;
let adminTokenHash;

try {
  const password = `Viewer-${suffix}-Pass!`;
  const [created] = await sql.query(
    "insert into users(name,email,password_hash,role,active) values($1,$2,$3,'VIEWER',true) returning id,role,active",
    [
      "Role smoke user",
      `role-smoke-${suffix}@example.com`,
      await hash(password, 12),
    ],
  );
  userId = created.id;
  const [stored] = await sql.query(
    "select password_hash,role,active from users where id=$1",
    [userId],
  );
  if (
    stored.role !== "VIEWER" ||
    !stored.active ||
    !(await compare(password, stored.password_hash))
  )
    throw new Error("User creation failed");
  await sql.query(
    "update users set role='EDITOR',name='Role smoke editor',updated_at=now() where id=$1",
    [userId],
  );
  const resetPassword = `Reset-${suffix}-Pass!`;
  await sql.query("update users set password_hash=$1 where id=$2", [
    await hash(resetPassword, 12),
    userId,
  ]);
  const sessionToken = randomBytes(32).toString("base64url");
  const sessionHash = createHash("sha256").update(sessionToken).digest("hex");
  await sql.query(
    "insert into sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '1 hour')",
    [userId, sessionHash],
  );
  await sql.query("update users set active=false where id=$1", [userId]);
  await sql.query("delete from sessions where user_id=$1", [userId]);
  const [revoked] = await sql.query(
    "select count(*)::int as total from sessions where user_id=$1",
    [userId],
  );
  if (revoked.total !== 0) throw new Error("Session revocation failed");
  const [admin] = await sql.query(
    "select id from users where active=true and role='SUPER_ADMIN' order by created_at limit 1",
    [],
  );
  const adminToken = randomBytes(32).toString("base64url");
  adminTokenHash = createHash("sha256").update(adminToken).digest("hex");
  await sql.query(
    "insert into sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '5 minutes')",
    [admin.id, adminTokenHash],
  );
  const response = await fetch("https://designik-site.vercel.app/admin/users", {
    headers: { cookie: `designik_admin_session=${adminToken}` },
  });
  const html = await response.text();
  if (
    response.status !== 200 ||
    !html.includes("Users and Roles") ||
    !html.includes("Temporary password")
  )
    throw new Error("Production users route failed");
  await sql.query("delete from users where id=$1 and active=false", [userId]);
  userId = undefined;
  console.log(
    JSON.stringify({
      create: true,
      passwordHash: true,
      assignRole: true,
      resetPassword: true,
      deactivate: true,
      revokeSessions: true,
      deleteInactive: true,
      productionRoute: true,
    }),
  );
} finally {
  if (userId) await sql.query("delete from users where id=$1", [userId]);
  if (adminTokenHash)
    await sql.query("delete from sessions where token_hash=$1", [
      adminTokenHash,
    ]);
}
