"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Terms and Conditions popup — same overlay/animation language as the other
 * site modals (light lavender wash, dgk-modal keyframes), Designik type
 * (Oswald display headings, wine accents, checkmark bullets).
 */

const EXIT_MS = 300;

type Bullet = { lead?: string; text: string };
type TermSection = { title: string; paras?: string[]; bullets?: Bullet[] };

const SECTIONS: TermSection[] = [
  {
    title: "Services",
    paras: [
      "Designik Agency provides a range of digital services, including but not limited to web design, development, branding, and social media marketing. The specific scope of services, deliverables, timelines, and fees for each project will be detailed in a separate Service Agreement or Project Proposal, which is incorporated by reference into these Terms.",
    ],
  },
  {
    title: "Client Responsibilities",
    bullets: [
      { text: "Provide timely feedback and approvals as required." },
      { text: "Supply all necessary content, materials, and information (e.g., text, images, brand guidelines) in the required format." },
      { text: "Grant necessary access to third party accounts (e.g., social media profiles, hosting accounts) as needed for us to perform our services." },
      { text: "Ensure that all materials provided by you do not infringe on any third party intellectual property rights." },
    ],
  },
  {
    title: "Fees and Payment",
    paras: [
      "Fees for our services will be outlined in your Service Agreement. Unless otherwise specified, invoices are due upon receipt. Late payments may incur an additional interest charge. All payments must be made in the currency specified on the invoice.",
    ],
  },
  {
    title: "Refund Policy",
    paras: [
      "We are committed to client satisfaction. However, due to the nature of creative and digital work, our refund policy is as follows:",
    ],
    bullets: [
      { text: "A client may request a full refund within the first seven (7) calendar days after the initial payment or service initiation." },
      { text: "This refund is only applicable if work on the project has not yet commenced." },
      { text: "Once work has started, refund requests are no longer applicable, and the client must pay for all work completed." },
    ],
  },
  {
    title: "Social Media Marketing and Ad Campaigns",
    paras: [
      "For clients engaging our social media marketing and advertising services, the following specific terms apply:",
    ],
    bullets: [
      { lead: "Ad Budget:", text: "The client’s advertising budget (ad spend) is entirely separate from Designik Agency’s management fees." },
      { lead: "Authorization:", text: "All ad spend amounts are authorized by the client before campaign launch." },
      { lead: "No Guarantees:", text: "While we strive for the best results, ad campaigns cannot guarantee sales, leads, or conversions." },
      { lead: "No Refunds:", text: "Payments for social media management or ad spend are non-refundable." },
    ],
  },
  {
    title: "Intellectual Property",
    paras: [
      "Upon receipt of full and final payment, Designik Agency grants the client an exclusive, perpetual license to use the final deliverables created for the project. We retain the right to use completed projects for portfolio and promotional purposes.",
    ],
  },
  {
    title: "Confidentiality",
    paras: [
      "Both parties agree to maintain the confidentiality of proprietary or sensitive information shared during the project. This obligation extends beyond the termination of the working relationship.",
    ],
  },
  {
    title: "Limitation of Liability",
    paras: [
      "In no event shall Designik Agency be liable for any indirect, incidental, or consequential damages, including loss of profits or data. Our total liability shall not exceed the total fees paid by you.",
    ],
  },
  {
    title: "Termination",
    paras: [
      "Either party may terminate the Service Agreement with thirty (30) days written notice. Upon termination, the client agrees to pay for all work completed up to that point.",
    ],
  },
  {
    title: "Governing Law",
    paras: [
      "These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Designik Agency is registered.",
    ],
  },
  {
    title: "Changes to Terms",
    paras: [
      "Designik Agency reserves the right to modify these Terms at any time. Continued use of our services constitutes acceptance of the updated Terms.",
    ],
  },
  {
    title: "Dispute Resolution",
    paras: ["The parties agree to resolve disputes through the following steps:"],
    bullets: [
      { lead: "Good-Faith Negotiation:", text: "Written notice and a 30-day negotiation period." },
      { lead: "Mediation:", text: "If unresolved, mediation with a neutral third party." },
      { lead: "Arbitration:", text: "If mediation fails, binding arbitration in the jurisdiction under “Governing Law.”" },
    ],
  },
];

function CheckBullet({ lead, text }: Bullet) {
  return (
    <li className="flex items-start gap-3 text-[14px] leading-[1.6] text-ink/80">
      <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-wine-500 text-white">
        <svg viewBox="0 0 16 16" fill="none" className="h-2.5 w-2.5" aria-hidden>
          <path d="M4 8.5 7 11.5 12.5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>
        {lead && <strong className="font-semibold text-ink">{lead} </strong>}
        {text}
      </span>
    </li>
  );
}

/** Parse the admin-edited terms body ("## Section", "- bullet", paragraphs). */
function parseTermsBody(body: string): TermSection[] {
  const sections: TermSection[] = [];
  let current: TermSection | null = null;
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("## ")) {
      current = { title: line.slice(3).trim(), paras: [], bullets: [] };
      sections.push(current);
    } else if (line.startsWith("- ")) {
      if (!current) continue;
      const text = line.slice(2).trim();
      const lead = text.match(/^([^:]{2,40}:)\s+(.*)$/);
      current.bullets!.push(lead ? { lead: lead[1], text: lead[2] } : { text });
    } else if (current) {
      current.paras!.push(line);
    }
  }
  return sections.filter((s) => (s.paras?.length || 0) + (s.bullets?.length || 0) > 0);
}

export default function TermsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  // Admin-editable overrides (Backend → Popups)
  const [copy, setCopy] = useState<{ title: string; updated: string; sections: TermSection[] | null }>({
    title: "Terms & Conditions",
    updated: "August 10, 2026",
    sections: null,
  });

  useEffect(() => {
    if (!open) return;
    fetch("/api/site-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (!c?.popups) return;
        const parsed = c.popups.termsBody ? parseTermsBody(c.popups.termsBody) : null;
        setCopy({
          title: c.popups.termsTitle || "Terms & Conditions",
          updated: c.popups.termsUpdated || "August 10, 2026",
          sections: parsed && parsed.length ? parsed : null,
        });
      })
      .catch(() => {});
  }, [open]);

  const handleClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      onClose();
    }, EXIT_MS);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, handleClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-closing={closing}
      onClick={handleClose}
      className="dgk-modal-overlay fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: "rgba(240,241,251,0.98)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="dgk-modal-card relative flex h-[90vh] w-full max-w-[840px] flex-col overflow-hidden rounded-[16px] bg-white"
        style={{ boxShadow: "rgba(51,53,71,0.22) 0px 40px 100px -20px" }}
      >
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-[0_4px_16px_rgba(0,0,0,0.18)] backdrop-blur transition-transform duration-300 hover:rotate-90 hover:bg-white"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
            <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* header */}
        <header className="border-b border-ink/10 bg-cream-100/60 px-7 pb-6 pt-8 sm:px-10">
          <p className="font-display text-[12px] font-semibold uppercase tracking-[0.22em] text-wine-500">
            Designik Agency
          </p>
          <h2 className="mt-2 font-display text-[30px] font-semibold uppercase leading-[1.05] text-ink sm:text-[38px]">
            {copy.title.includes("&") ? (
              <>
                {copy.title.split("&")[0]}
                <span className="text-wine-500">&amp;</span>
                {copy.title.split("&").slice(1).join("&")}
              </>
            ) : (
              copy.title
            )}
          </h2>
          <p className="mt-2 text-[13px] text-ink/60">Last Updated: {copy.updated}</p>
        </header>

        {/* scrollable body */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-7 py-7 sm:px-10">
          <p className="text-[14px] leading-[1.7] text-ink/75">
            Welcome to Designik Agency. These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of the services
            provided by Designik Agency (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By engaging our services, you
            (&ldquo;Client,&rdquo; &ldquo;you&rdquo;) agree to be bound by these Terms in their entirety. Please read them carefully.
          </p>

          {(copy.sections || SECTIONS).map((s, i) => (
            <section key={s.title} className="mt-8">
              <h3 className="flex items-baseline gap-3 font-display text-[18px] font-semibold uppercase leading-tight text-ink">
                <span className="font-display text-[14px] font-semibold text-wine-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.title}
              </h3>
              {s.paras?.map((p) => (
                <p key={p.slice(0, 24)} className="mt-3 text-[14px] leading-[1.7] text-ink/75">
                  {p}
                </p>
              ))}
              {s.bullets && s.bullets.length > 0 && (
                <ul className="mt-4 space-y-2.5">
                  {s.bullets.map((b) => (
                    <CheckBullet key={b.text.slice(0, 24)} {...b} />
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* contact */}
          <section className="mt-8 rounded-[12px] bg-cream-100 p-6">
            <h3 className="flex items-baseline gap-3 font-display text-[18px] font-semibold uppercase leading-tight text-ink">
              <span className="font-display text-[14px] font-semibold text-wine-500">13</span>
              Contact Information
            </h3>
            <p className="mt-3 text-[14px] leading-[1.8] text-ink/80">
              Email:{" "}
              <a href="mailto:info@designik.agency" className="font-semibold text-wine-500 underline-offset-2 hover:underline">
                info@designik.agency
              </a>
              <br />
              Phone:{" "}
              <a href="tel:+14122061270" className="font-semibold text-wine-500 underline-offset-2 hover:underline">
                412-206-1270
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
