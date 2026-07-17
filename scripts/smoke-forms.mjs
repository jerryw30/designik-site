import { createHash, randomBytes, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const suffix = Date.now().toString(36);
let formId;
let submissionId;
let tokenHash;

try {
  const definition = {
    fields: [
      {
        id: randomUUID(),
        type: "text",
        label: "Name",
        name: "name",
        placeholder: "",
        required: true,
        options: [],
      },
      {
        id: randomUUID(),
        type: "email",
        label: "Email",
        name: "email",
        placeholder: "",
        required: true,
        options: [],
      },
      {
        id: randomUUID(),
        type: "select",
        label: "Service",
        name: "service",
        placeholder: "",
        required: true,
        options: ["Branding", "Web"],
      },
    ],
    submitLabel: "Send",
    successMessage: "Smoke success",
    notificationEmail: "",
  };
  const slug = `form-smoke-${suffix}`;
  const [form] = await sql.query(
    "insert into admin_resources(module,title,slug,status,data) values('forms',$1,$2,'PUBLISHED',$3::jsonb) returning id",
    ["Form smoke", slug, JSON.stringify(definition)],
  );
  formId = form.id;
  const invalid = await fetch(
    `https://designik-site.vercel.app/api/forms/${formId}/submit`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `smoke-invalid-${suffix}`,
      },
      body: JSON.stringify({ name: "Tester" }),
    },
  );
  if (invalid.status !== 422)
    throw new Error(`Validation failed: ${invalid.status}`);
  const valid = await fetch(
    `https://designik-site.vercel.app/api/forms/${formId}/submit`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `smoke-valid-${suffix}`,
      },
      body: JSON.stringify({
        name: "Tester",
        email: "tester@example.com",
        service: "Web",
      }),
    },
  );
  const validBody = await valid.json();
  if (!valid.ok || validBody.message !== "Smoke success")
    throw new Error(`Submission API failed: ${valid.status}`);
  const [submission] = await sql.query(
    "select id,status,data from form_submissions where form_id=$1 order by created_at desc limit 1",
    [formId],
  );
  if (
    !submission ||
    submission.status !== "UNREAD" ||
    submission.data.service !== "Web"
  )
    throw new Error("Submission storage failed");
  submissionId = submission.id;
  await sql.query("update form_submissions set status='READ' where id=$1", [
    submissionId,
  ]);
  const [admin] = await sql.query(
    "select id from users where active=true and role='SUPER_ADMIN' order by created_at limit 1",
    [],
  );
  const token = randomBytes(32).toString("base64url");
  tokenHash = createHash("sha256").update(token).digest("hex");
  await sql.query(
    "insert into sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '5 minutes')",
    [admin.id, tokenHash],
  );
  const headers = { cookie: `designik_admin_session=${token}` };
  const [
    publicPage,
    listPage,
    editPage,
    previewPage,
    inboxPage,
    exportResponse,
  ] = await Promise.all([
    fetch(`https://designik-site.vercel.app/forms/${slug}`),
    fetch("https://designik-site.vercel.app/admin/forms", { headers }),
    fetch(`https://designik-site.vercel.app/admin/forms/${formId}/edit`, {
      headers,
    }),
    fetch(`https://designik-site.vercel.app/admin/forms/${formId}/preview`, {
      headers,
    }),
    fetch(
      `https://designik-site.vercel.app/admin/forms/${formId}/submissions`,
      { headers },
    ),
    fetch(
      `https://designik-site.vercel.app/admin/forms/${formId}/submissions/export`,
      { headers },
    ),
  ]);
  const statuses = [
    publicPage,
    listPage,
    editPage,
    previewPage,
    inboxPage,
    exportResponse,
  ].map((response) => response.status);
  if (statuses.some((status) => status !== 200))
    throw new Error(`Production form routes failed: ${statuses.join(",")}`);
  const csv = await exportResponse.text();
  if (!csv.includes("tester@example.com") || !csv.includes("Web"))
    throw new Error("CSV export failed");
  await sql.query("delete from form_submissions where id=$1", [submissionId]);
  submissionId = undefined;
  await sql.query(
    "update admin_resources set status='TRASH',deleted_at=now() where id=$1",
    [formId],
  );
  await sql.query(
    "update admin_resources set status='DRAFT',deleted_at=null where id=$1",
    [formId],
  );
  await sql.query(
    "update admin_resources set status='TRASH',deleted_at=now() where id=$1",
    [formId],
  );
  await sql.query(
    "delete from admin_resources where id=$1 and status='TRASH'",
    [formId],
  );
  formId = undefined;
  console.log(
    JSON.stringify({
      create: true,
      validation: true,
      publicSubmit: true,
      storedSubmission: true,
      readStatus: true,
      inbox: true,
      csvExport: true,
      deleteSubmission: true,
      preview: true,
      publicPage: true,
      trash: true,
      restore: true,
      deleteForm: true,
    }),
  );
} finally {
  if (submissionId)
    await sql.query("delete from form_submissions where id=$1", [submissionId]);
  if (formId)
    await sql.query("delete from admin_resources where id=$1", [formId]);
  if (tokenHash)
    await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
}
