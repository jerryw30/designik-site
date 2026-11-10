import type { Metadata } from "next";
import Nav from "@/components/sections/Nav";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "Terms and Conditions | RX Marketers LLC dba Designik Agency",
  description:
    "Terms and Conditions for RX Marketers LLC dba Designik Agency, including SMS messaging terms, opt-out instructions, and business communication policies.",
  alternates: {
    canonical: "/terms-and-conditions",
  },
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="border-b border-black/10 py-8 last:border-b-0 md:py-10">
    <h2 className="font-display text-2xl font-semibold uppercase tracking-[-0.02em] text-wine-900 md:text-3xl">
      {title}
    </h2>
    <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70 md:text-base">
      {children}
    </div>
  </section>
);

export default function TermsAndConditionsPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-cream-50 text-ink">
        <header className="relative overflow-hidden bg-wine-900 px-6 pb-20 pt-36 text-white md:pb-28 md:pt-44">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-12 h-80 w-80 rounded-full bg-pink-brand/20 blur-3xl"
          />
          <div className="relative mx-auto max-w-5xl">
            <p className="font-display text-sm font-medium uppercase tracking-[0.24em] text-white/60">
              Legal
            </p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold uppercase leading-[0.95] tracking-[-0.04em] sm:text-6xl md:text-8xl">
              Terms and Conditions
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
              These Terms and Conditions govern your use of RX Marketers LLC dba Designik Agency&apos;s
              website, services, and business communications.
            </p>
            <p className="mt-5 text-sm text-white/50">
              Effective date: September 28, 2026
            </p>
          </div>
        </header>

        <div className="px-5 py-14 md:px-8 md:py-20">
          <article className="mx-auto max-w-4xl rounded-[28px] bg-white px-6 py-8 shadow-[0_24px_80px_rgba(83,8,35,0.08)] ring-1 ring-black/5 sm:px-10 md:px-14 md:py-12">
            <Section title="1. Acceptance of These Terms">
              <p>
                By accessing this website, requesting a consultation, purchasing
                services, signing a proposal or agreement, or otherwise engaging
                with RX Marketers LLC dba Designik Agency, you agree to these Terms and Conditions.
                If a separate written agreement applies to a project, that
                agreement will control if there is a conflict with these terms.
              </p>
            </Section>

            <Section title="2. Services">
              <p>
                RX Marketers LLC dba Designik Agency provides creative, marketing, design,
                development, technology, consulting, and related business
                services. The specific scope, deliverables, schedule, and fees
                for a project may be defined in a proposal, statement of work,
                invoice, service agreement, or other written communication.
              </p>
              <p>
                Timelines and results can depend on timely client feedback,
                approvals, access, content, third-party platforms, and other
                factors outside RX Marketers LLC dba Designik Agency&apos;s direct control.
              </p>
            </Section>

            <Section title="3. Client Responsibilities">
              <p>
                Clients are responsible for providing accurate information,
                required approvals, account access, content, licenses, and other
                materials reasonably needed to perform the agreed services.
                Clients are also responsible for confirming that materials they
                provide may legally be used for the project.
              </p>
            </Section>

            <Section title="4. Fees, Payments, and Project Terms">
              <p>
                Fees, deposits, payment schedules, recurring charges, and
                cancellation terms are governed by the applicable proposal,
                invoice, service agreement, or written project terms. Unless
                otherwise agreed in writing, work may be paused when required
                payments or client-supplied materials are overdue.
              </p>
            </Section>

            <Section title="5. Intellectual Property">
              <p>
                Ownership and usage rights for project deliverables are governed
                by the applicable project agreement. RX Marketers LLC dba Designik Agency retains
                ownership of its pre-existing tools, processes, know-how,
                reusable code, frameworks, templates, and other materials that
                were not created exclusively for a client.
              </p>
              <p>
                Third-party assets, software, fonts, plugins, platforms, and
                licensed materials remain subject to their respective owners&apos;
                terms and licenses.
              </p>
            </Section>

            <Section title="6. Third-Party Services">
              <p>
                Some services may rely on third-party providers such as hosting
                companies, advertising platforms, payment processors, domain
                registrars, software vendors, analytics providers, or
                communications platforms. RX Marketers LLC dba Designik Agency is not responsible for
                outages, policy changes, account restrictions, pricing changes,
                or other actions taken by third-party providers.
              </p>
            </Section>

            <section className="my-10 rounded-[26px] bg-wine-900 px-6 py-9 text-white shadow-[0_24px_70px_rgba(83,8,35,0.2)] sm:px-9 md:my-14 md:px-12 md:py-12">
              <div className="mx-auto max-w-2xl">
                <p className="font-display text-sm font-medium uppercase tracking-[0.22em] text-pink-brand">
                  Communications
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold uppercase tracking-[-0.02em] md:text-4xl">
                  SMS Messaging Terms
                </h2>

                <div className="mt-8 space-y-6 text-[15px] leading-7 text-white/78 md:text-base">
                  <div>
                    <h3 className="font-semibold text-white">Program Name</h3>
                    <p>RX Marketers LLC dba Designik Agency SMS Messaging Program</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">
                      Program Description
                    </h3>
                    <p>
                      RX Marketers LLC dba Designik Agency sends SMS messages to customers and leads
                      who have voluntarily opted in to receive communications
                      regarding services, consultations, updates, promotions,
                      and business-related information.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">
                      Message Frequency
                    </h3>
                    <p>
                      Message frequency varies based on your interaction with
                      RX Marketers LLC dba Designik Agency.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">
                      Message and Data Rates
                    </h3>
                    <p>Message and data rates may apply.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">
                      Opt-Out Instructions
                    </h3>
                    <p>
                      You may stop receiving messages at any time by replying:
                    </p>
                    <p className="mt-2 inline-flex rounded-full bg-white px-4 py-1.5 font-bold tracking-[0.12em] text-wine-900">
                      STOP
                    </p>
                    <p className="mt-3">
                      After opting out, you will no longer receive SMS messages
                      unless you provide consent again.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">
                      Help Instructions
                    </h3>
                    <p>For assistance, reply:</p>
                    <p className="mt-2 inline-flex rounded-full bg-white px-4 py-1.5 font-bold tracking-[0.12em] text-wine-900">
                      HELP
                    </p>
                    <p className="mt-3">
                      or contact:{" "}
                      <a
                        href="mailto:info@designik.agency"
                        className="font-semibold text-white underline decoration-white/40 underline-offset-4 transition hover:decoration-white"
                      >
                        info@designik.agency
                      </a>
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">
                      Carrier Disclaimer
                    </h3>
                    <p>
                      Carriers are not liable for delayed or undelivered
                      messages.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">Consent</h3>
                    <p>
                      Consent to receive SMS messages is not a condition of
                      purchasing any goods or services.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Section title="7. Website Use">
              <p>
                You may use this website for lawful purposes only. You may not
                attempt to interfere with the website, access restricted systems
                without authorization, misuse forms or communications, or use
                the website in a way that violates applicable law or the rights
                of another person or business.
              </p>
            </Section>

            <Section title="8. No Guarantee of Specific Results">
              <p>
                RX Marketers LLC dba Designik Agency works to provide professional services and
                commercially reasonable strategies, but specific business,
                marketing, advertising, search, revenue, traffic, conversion,
                ranking, or other performance results are not guaranteed unless
                a written agreement expressly states otherwise.
              </p>
            </Section>

            <Section title="9. Limitation of Liability">
              <p>
                To the maximum extent permitted by applicable law, Designik
                Agency will not be liable for indirect, incidental,
                consequential, special, or punitive damages arising from the use
                of the website, services, third-party platforms, or business
                communications. Any liability that cannot legally be excluded
                remains subject to applicable law and any controlling written
                agreement.
              </p>
            </Section>

            <Section title="10. Termination">
              <p>
                RX Marketers LLC dba Designik Agency may suspend or terminate access to services when
                required by an applicable agreement, nonpayment, unlawful use,
                abuse, security concerns, or a material breach of agreed terms.
                Client cancellation and termination rights are governed by the
                applicable service agreement or written project terms.
              </p>
            </Section>

            <Section title="11. Governing Law">
              <p>
                Unless a separate written agreement provides otherwise, these
                Terms and Conditions are governed by the laws applicable in the
                Commonwealth of Pennsylvania, without regard to conflict-of-law
                principles.
              </p>
            </Section>

            <Section title="12. Changes to These Terms">
              <p>
                RX Marketers LLC dba Designik Agency may update these Terms and Conditions from time
                to time. The current version will be posted on this page with an
                updated effective date.
              </p>
            </Section>

            <Section title="13. Contact RX Marketers LLC dba Designik Agency">
              <p>
                Questions about these Terms and Conditions or the SMS Messaging
                Program can be directed to RX Marketers LLC dba Designik Agency.
              </p>
              <div className="mt-5 rounded-2xl bg-cream-50 p-5 text-black/75 ring-1 ring-black/5">
                <p className="font-semibold text-wine-900">RX Marketers LLC dba Designik Agency</p>
                <p className="mt-2">118 Field Club Rd, Pittsburgh, PA 15238</p>
                <p className="mt-1">
                  <a
                    href="tel:+14122532498"
                    className="transition hover:text-wine-500"
                  >
                    +1 412-253-2498
                  </a>
                </p>
                <p className="mt-1">
                  <a
                    href="mailto:info@designik.agency"
                    className="transition hover:text-wine-500"
                  >
                    info@designik.agency
                  </a>
                </p>
              </div>
            </Section>


            <div className="mt-12 border-t border-black/10 pt-8 text-center">
              <a
                href="/privacy-policy"
                className="font-display text-base font-semibold uppercase tracking-[0.04em] text-wine-900 underline decoration-wine-500/35 underline-offset-4 transition hover:text-wine-500 hover:decoration-wine-500"
              >
                Privacy Policy
              </a>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
