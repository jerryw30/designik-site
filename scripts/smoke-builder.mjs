import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
const sql=neon(process.env.DATABASE_URL);const token=randomBytes(32).toString("base64url");const tokenHash=createHash("sha256").update(token).digest("hex");
const [user]=await sql.query("select id from users where active=true order by created_at limit 1",[]);const [page]=await sql.query("select id from pages where slug='home' limit 1",[]);
await sql.query("insert into sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '5 minutes')",[user.id,tokenHash]);
try{const response=await fetch(`https://designik-site.vercel.app/admin/pages/${page.id}/builder`,{headers:{cookie:`designik_admin_session=${token}`}});const html=await response.text();console.log(JSON.stringify({status:response.status,navigator:html.includes("Navigator"),addSection:html.includes("Add section"),realPreview:html.includes("Real page")}));if(response.status!==200||!html.includes("Navigator"))process.exitCode=1;}finally{await sql.query("delete from sessions where token_hash=$1",[tokenHash]);}
