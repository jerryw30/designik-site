import { neon } from "@neondatabase/serverless";
const sql=neon(process.env.DATABASE_URL);
const rows=await sql.query("select s.type, s.position from sections s join pages p on p.id=s.page_id where p.slug='home' order by s.position",[]);
console.log(JSON.stringify({total:rows.length,types:rows.map((row)=>row.type),marquees:rows.filter((row)=>row.type==="agency-marquee").length}));
if(process.argv.includes("--normalize")&&rows.filter((row)=>row.type==="agency-marquee").length<5){
  const [page]=await sql.query("select id from pages where slug='home' limit 1",[]);
  const records=await sql.query("select id,type,name from sections where page_id=$1 order by position",[page.id]);
  const desired=["header","hero","agency-marquee","stats","about","agency-marquee","services","brand-heights","experience","agency-marquee","portfolio","team","interactive","agency-marquee","testimonials","agency-marquee","footer"];
  const buckets=new Map(); for(const row of records)buckets.set(row.type,[...(buckets.get(row.type)||[]),row]);
  for(let i=0;i<records.length;i++)await sql.query("update sections set position=$1 where id=$2",[100+i,records[i].id]);
  for(let position=0;position<desired.length;position++){const type=desired[position];const item=buckets.get(type)?.shift();if(item)await sql.query("update sections set position=$1 where id=$2",[position,item.id]);else await sql.query("insert into sections(page_id,type,name,position) values($1,$2,$3,$4)",[page.id,type,`Agency Marquee ${position}`,position]);}
  console.log("normalized");
}
