import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { getSiteConfig } from "@/lib/site-config";
import { AdminShell } from "../admin-shell";
import { T } from "../theme";
import { saveContactSettings, savePopupSettings, saveTermsSettings } from "./actions";

export const dynamic = "force-dynamic";

/** Default terms in the editable "## section / - bullet" markup. */
const DEFAULT_TERMS_TEXT = `## Services
Designik Agency provides a range of digital services, including but not limited to web design, development, branding, and social media marketing. The specific scope of services, deliverables, timelines, and fees for each project will be detailed in a separate Service Agreement or Project Proposal, which is incorporated by reference into these Terms.

## Client Responsibilities
- Provide timely feedback and approvals as required.
- Supply all necessary content, materials, and information (e.g., text, images, brand guidelines) in the required format.
- Grant necessary access to third party accounts (e.g., social media profiles, hosting accounts) as needed for us to perform our services.
- Ensure that all materials provided by you do not infringe on any third party intellectual property rights.

## Fees and Payment
Fees for our services will be outlined in your Service Agreement. Unless otherwise specified, invoices are due upon receipt. Late payments may incur an additional interest charge. All payments must be made in the currency specified on the invoice.

## Refund Policy
We are committed to client satisfaction. However, due to the nature of creative and digital work, our refund policy is as follows:
- A client may request a full refund within the first seven (7) calendar days after the initial payment or service initiation.
- This refund is only applicable if work on the project has not yet commenced.
- Once work has started, refund requests are no longer applicable, and the client must pay for all work completed.

## Social Media Marketing and Ad Campaigns
For clients engaging our social media marketing and advertising services, the following specific terms apply:
- Ad Budget: The client's advertising budget (ad spend) is entirely separate from Designik Agency's management fees.
- Authorization: All ad spend amounts are authorized by the client before campaign launch.
- No Guarantees: While we strive for the best results, ad campaigns cannot guarantee sales, leads, or conversions.
- No Refunds: Payments for social media management or ad spend are non-refundable.

## Intellectual Property
Upon receipt of full and final payment, Designik Agency grants the client an exclusive, perpetual license to use the final deliverables created for the project. We retain the right to use completed projects for portfolio and promotional purposes.

## Confidentiality
Both parties agree to maintain the confidentiality of proprietary or sensitive information shared during the project. This obligation extends beyond the termination of the working relationship.

## Limitation of Liability
In no event shall Designik Agency be liable for any indirect, incidental, or consequential damages, including loss of profits or data. Our total liability shall not exceed the total fees paid by you.

## Termination
Either party may terminate the Service Agreement with thirty (30) days written notice. Upon termination, the client agrees to pay for all work completed up to that point.

## Governing Law
These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Designik Agency is registered.

## Changes to Terms
Designik Agency reserves the right to modify these Terms at any time. Continued use of our services constitutes acceptance of the updated Terms.

## Dispute Resolution
The parties agree to resolve disputes through the following steps:
- Good-Faith Negotiation: Written notice and a 30-day negotiation period.
- Mediation: If unresolved, mediation with a neutral third party.
- Arbitration: If mediation fails, binding arbitration in the jurisdiction under "Governing Law."`;

export default async function PopupsPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "forms")) redirect("/admin");
  const [config, [getStartedForm]] = await Promise.all([
    getSiteConfig(),
    db
      .select({ id: adminResources.id })
      .from(adminResources)
      .where(and(eq(adminResources.module, "forms"), eq(adminResources.slug, "start-a-project")))
      .limit(1),
  ]);

  const label = "block text-[12.5px] font-semibold text-neutral-600";
  const hint = "mt-1 text-[12px] text-neutral-400";

  return (
    <AdminShell user={user} title="Popups">
      <div>
        <h2 className={T.screenTitle}>Popups</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          The site&rsquo;s popups and where they open from. Edits go live immediately.
        </p>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          {/* Start a Project */}
          <section id="start-a-project" className={T.card}>
            <div className={T.cardHeader}>
              <h3 className="text-[15px] font-semibold">Start a Project form</h3>
              <p className="text-[12px] text-neutral-400">
                Opens from: header button, hero &ldquo;Start Something&rdquo;, footer Contact, case-study popups
              </p>
            </div>
            <form action={savePopupSettings} className="space-y-4 p-5">
              <div>
                <label className={label}>Heading (one line per row)</label>
                <textarea name="getStartedTitle" rows={2} defaultValue={config.popups.getStartedTitle} className={`${T.input} mt-1.5 w-full`} />
              </div>
              <div>
                <label className={label}>Success message</label>
                <textarea name="getStartedSuccess" rows={2} defaultValue={config.popups.getStartedSuccess} className={`${T.input} mt-1.5 w-full`} />
              </div>
              <div className="rounded-lg bg-neutral-50 px-4 py-3">
                <p className="text-[12.5px] font-semibold text-neutral-600">Form fields</p>
                <p className={hint}>
                  Add, remove or reorder the fields (name, email, budget options, services…) in the Forms builder.
                  Keep an Email field — submissions require it.
                </p>
                {getStartedForm ? (
                  <Link href={`/admin/forms/${getStartedForm.id}/edit`} className={`mt-2 inline-block ${T.btnPrimary}`}>
                    Edit form fields
                  </Link>
                ) : (
                  <p className="mt-2 text-[12px] text-neutral-400">Form definition not found — create one named “Start a Project”.</p>
                )}
              </div>
              <button className={T.btnPrimary}>Save popup text</button>
            </form>
          </section>

          {/* Terms & Conditions */}
          <section id="terms" className={T.card}>
            <div className={T.cardHeader}>
              <h3 className="text-[15px] font-semibold">Terms &amp; Conditions popup</h3>
              <p className="text-[12px] text-neutral-400">Opens from: footer &ldquo;Terms and Conditions&rdquo;</p>
            </div>
            <form action={saveTermsSettings} className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>Title</label>
                  <input name="termsTitle" defaultValue={config.popups.termsTitle} className={`${T.input} mt-1.5 w-full`} />
                </div>
                <div>
                  <label className={label}>&ldquo;Last updated&rdquo; date</label>
                  <input name="termsUpdated" defaultValue={config.popups.termsUpdated} className={`${T.input} mt-1.5 w-full`} />
                </div>
              </div>
              <div>
                <label className={label}>Terms content</label>
                <p className={hint}>
                  Start a section with <code className="rounded bg-neutral-100 px-1">## Heading</code>, bullets with{" "}
                  <code className="rounded bg-neutral-100 px-1">- item</code>. Plain lines become paragraphs.
                </p>
                <textarea
                  name="termsBody"
                  rows={16}
                  defaultValue={config.popups.termsBody || DEFAULT_TERMS_TEXT}
                  className={`${T.input} mt-1.5 w-full font-mono text-[12px] leading-relaxed`}
                />
              </div>
              <button className={T.btnPrimary}>Save Terms &amp; Conditions</button>
            </form>
          </section>
        </div>

        <div className="space-y-5">
          {/* Booking + phone */}
          <section id="booking" className={T.card}>
            <div className={T.cardHeader}>
              <h3 className="text-[15px] font-semibold">Booking popup &amp; phone</h3>
              <p className="text-[12px] text-neutral-400">
                Opens from: hero &ldquo;Book an Appointment&rdquo;, footer &ldquo;Book a Call&rdquo;, chat buttons and links
              </p>
            </div>
            <form action={saveContactSettings} className="space-y-4 p-5">
              <div>
                <label className={label}>Calendly link</label>
                <input name="calendlyUrl" defaultValue={config.calendlyUrl} className={`${T.input} mt-1.5 w-full`} />
                <p className={hint}>Shown inside the on-site booking popup.</p>
              </div>
              <div>
                <label className={label}>Phone number</label>
                <input name="phone" defaultValue={config.phone} className={`${T.input} mt-1.5 w-full`} />
                <p className={hint}>Used by the chat&rsquo;s Call button.</p>
              </div>
              <button className={T.btnPrimary}>Save booking &amp; phone</button>
            </form>
          </section>

          {/* Where everything lives */}
          <section className={T.card}>
            <div className={T.cardHeader}>
              <h3 className="text-[15px] font-semibold">All site popups</h3>
            </div>
            <ul className="divide-y">
              {[
                { name: "Start a Project form", where: "Header · Hero · Footer Contact · Case studies", edit: "Edit", href: "#start-a-project" },
                { name: "Booking (Calendly)", where: "Hero · Footer Book a Call · Chat", edit: "Edit", href: "#booking" },
                { name: "Terms & Conditions", where: "Footer", edit: "Edit", href: "#terms" },
                { name: "Case-study popups", where: "Portfolio cards", edit: "Edit in Pages", href: "/admin/pages" },
                { name: "Chat widget", where: "Every page (bottom right)", edit: "Chat settings", href: "/admin/chat" },
              ].map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-[13.5px] font-medium">{p.name}</p>
                    <p className="text-[12px] text-neutral-400">{p.where}</p>
                  </div>
                  <a href={p.href} className={`shrink-0 text-[12.5px] font-medium ${T.link}`}>
                    {p.edit}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
