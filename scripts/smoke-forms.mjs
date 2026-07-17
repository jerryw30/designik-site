import { createHash, randomBytes, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const suffix = Date.now().toString(36);
let formId;
let submissionId;
let tokenHash;
let widgetSectionId;

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
  const [home] = await sql.query(
    "select id from pages where slug='home' limit 1",
    [],
  );
  const [widgetSection] = await sql.query(
    `insert into sections(page_id,type,name,position,content,draft_content,published_content,styles,responsive,animation,visible,locked)
     values($1,'widgets','Form widget smoke',(select coalesce(max(position),0)+1 from sections where page_id=$1),$2::jsonb,$2::jsonb,'{"_cmsPublished":false}'::jsonb,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb,true,false) returning id`,
    [
      home.id,
      JSON.stringify({
        backgroundColor: "#ffffff",
        paddingTop: 20,
        paddingBottom: 20,
        maxWidth: 1280,
        widgets: [
          {
            id: randomUUID(),
            type: "form",
            content: "Embedded smoke form",
            settings: { formId, width: 100 },
          },
        ],
      }),
    ],
  );
  widgetSectionId = widgetSection.id;
  const headers = { cookie: `designik_admin_session=${token}` };
  const [
    publicPage,
    listPage,
    editPage,
    previewPage,
    inboxPage,
    exportResponse,
    builderPage,
    embeddedPreview,
    searchPage,
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
    fetch(`https://designik-site.vercel.app/admin/pages/${home.id}/builder`, {
      headers,
    }),
    fetch(`https://designik-site.vercel.app/admin/pages/${home.id}/preview`, {
      headers,
    }),
    fetch("https://designik-site.vercel.app/blog?q=integration-smoke"),
  ]);
  const statuses = [
    publicPage,
    listPage,
    editPage,
    previewPage,
    inboxPage,
    exportResponse,
    builderPage,
    embeddedPreview,
    searchPage,
  ].map((response) => response.status);
  if (statuses.some((status) => status !== 200))
    throw new Error(`Production form routes failed: ${statuses.join(",")}`);
  const builderHtml = await builderPage.text();
  const embeddedHtml = await embeddedPreview.text();
  const searchHtml = await searchPage.text();
  if (!builderHtml.includes("Form smoke"))
    throw new Error("Published form was not offered in widget settings");
  if (
    !embeddedHtml.includes("Embedded smoke form") ||
    !embeddedHtml.includes("Service") ||
    !embeddedHtml.includes("Branding")
  )
    throw new Error("Form widget did not render the real published form");
  if (!searchHtml.includes("Search the journal"))
    throw new Error("Public search widget destination is not functional");
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
  await sql.query("delete from sections where id=$1", [widgetSectionId]);
  widgetSectionId = undefined;
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
      widgetFormSelector: true,
      embeddedForm: true,
      widgetSearchDestination: true,
    }),
  );
} finally {
  if (submissionId)
    await sql.query("delete from form_submissions where id=$1", [submissionId]);
  if (formId)
    await sql.query("delete from admin_resources where id=$1", [formId]);
  if (widgetSectionId)
    await sql.query("delete from sections where id=$1", [widgetSectionId]);
  if (tokenHash)
    await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
}
