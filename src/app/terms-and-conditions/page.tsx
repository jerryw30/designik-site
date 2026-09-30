import type { Metadata } from "next";
import Nav from "@/components/sections/Nav";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "Terms and Conditions | Designik Agency",
  description:
    "Terms and Conditions for Designik Agency, including SMS messaging terms, opt-out instructions, and business communication policies.",
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
              These Terms and Conditions govern your use of Designik Agency&apos;s
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
                with Designik Agency, you agree to these Terms and Conditions.
                If a separate written agreement applies to a project, that
                agreement will control if there is a conflict with these terms.
              </p>
            </Section>

            <Section title="2. Services">
              <p>
                Designik Agency provides creative, marketing, design,
                development, technology, consulting, and related business
                services. The specific scope, deliverables, schedule, and fees
                for a project may be defined in a proposal, statement of work,
                invoice, service agreement, or other written communication.
              </p>
              <p>
                Timelines and results can depend on timely client feedback,
                approvals, access, content, third-party platforms, and other
                factors outside Designik Agency&apos;s direct control.
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
                by the applicable project agreement. Designik Agency retains
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
                communications platforms. Designik Agency is not responsible for
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
                    <p>Designik Agency SMS Messaging Program</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">
                      Program Description
                    </h3>
                    <p>
                      Designik Agency sends SMS messages to customers and leads
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
                      Designik Agency.
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
                Designik Agency works to provide professional services and
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
                Designik Agency may suspend or terminate access to services when
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
                Designik Agency may update these Terms and Conditions from time
                to time. The current version will be posted on this page with an
                updated effective date.
              </p>
            </Section>

            <Section title="13. Contact Designik Agency">
              <p>
                Questions about these Terms and Conditions or the SMS Messaging
                Program can be directed to Designik Agency.
              </p>
              <div className="mt-5 rounded-2xl bg-cream-50 p-5 text-black/75 ring-1 ring-black/5">
                <p className="font-semibold text-wine-900">Designik Agency</p>
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


            <div className="mt-14 border-t-2 border-wine-900/15 pt-12 md:mt-16 md:pt-14">
              <p className="font-display text-sm font-medium uppercase tracking-[0.22em] text-wine-500">
                Privacy
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold uppercase tracking-[-0.03em] text-wine-900 md:text-5xl">
                Privacy Policy
              </h2>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-black/65 md:text-base">
                This Privacy Policy explains how Designik Agency collects, uses,
                protects, and handles personal information when you interact with
                our website, services, and communications.
              </p>
              <p className="mt-3 text-sm text-black/45">
                Effective date: September 28, 2026
              </p>
            </div>

            <Section title="What Information Do We Gather?">
              <p>
                This Privacy Policy explains how Designik Agency collects and
                uses your personal data. When you submit an online query,
                consultation request, contact form, or other communication, you
                may be asked to provide basic information so we can contact you
                and understand your needs.
              </p>
              <p>
                The information requested may include your name, email address,
                phone number, country, company information, project details, and
                other information you choose to provide.
              </p>
            </Section>

            <Section title="Do We Disclose Any Information to Outside Parties?">
              <p>
                Designik Agency does not sell or trade your personally
                identifiable information. We may share information with trusted
                service providers, contractors, subsidiaries, or partners who
                assist us in operating our website, conducting our business, or
                servicing you, provided they are required to protect the
                confidentiality of that information.
              </p>
              <p>
                Non-personally identifiable or aggregated visitor information
                may be used or shared for analytics, marketing, advertising, or
                website-improvement purposes.
              </p>
            </Section>

            <Section title="How Do We Protect Your Information?">
              <p>
                Designik Agency uses reasonable administrative, technical, and
                organizational safeguards designed to protect personal
                information. Our website uses secure connections and SSL/TLS
                encryption where applicable to help protect information while it
                is transmitted.
              </p>
              <p>
                No method of transmission or storage is completely secure, so
                while we take reasonable measures to protect information, we
                cannot guarantee absolute security.
              </p>
            </Section>

            <Section title="What Do We Use Your Information For?">
              <p>
                We use personal information to respond to inquiries, provide and
                improve our services, process project or order-related requests,
                communicate with you, and operate our business efficiently.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Improving website features and user experience based on feedback</li>
                <li>Providing service, project, consultation, and account communications</li>
                <li>Keeping opted-in users updated about relevant offers and updates</li>
                <li>Enhancing customer service and response times</li>
                <li>Processing requests and maintaining accurate business records</li>
              </ul>
            </Section>

            <section className="my-10 rounded-[26px] bg-wine-900 px-6 py-9 text-white shadow-[0_24px_70px_rgba(83,8,35,0.2)] sm:px-9 md:my-14 md:px-12 md:py-12">
              <div className="mx-auto max-w-2xl">
                <p className="font-display text-sm font-medium uppercase tracking-[0.22em] text-pink-brand">
                  Mobile Privacy
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold uppercase tracking-[-0.02em] md:text-4xl">
                  SMS Privacy &amp; Messaging Consent
                </h2>
                <div className="mt-8 space-y-5 text-[15px] leading-7 text-white/78 md:text-base">
                  <p>
                    Designik Agency may collect your phone number when you
                    voluntarily provide it through our website forms, chat
                    widget, consultation requests, or other communication
                    methods.
                  </p>
                  <p>
                    By providing your phone number and opting in to receive SMS
                    messages from Designik Agency, you agree that we may send you
                    marketing, promotional, informational, and service-related
                    text messages related to our services.
                  </p>
                  <p>
                    Message frequency varies depending on your interactions with
                    Designik Agency. Message and data rates may apply.
                  </p>
                  <p className="font-semibold text-white">
                    We respect your privacy. Mobile information and SMS opt-in
                    data will not be sold, rented, shared, or disclosed to third
                    parties or affiliates for marketing or promotional purposes.
                  </p>
                  <div>
                    <p>You can unsubscribe from SMS messages at any time by replying:</p>
                    <p className="mt-2 inline-flex rounded-full bg-white px-4 py-1.5 font-bold tracking-[0.12em] text-wine-900">
                      STOP
                    </p>
                  </div>
                  <div>
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
                </div>
              </div>
            </section>

            <Section title="General Data Protection Regulation (GDPR) Compliance">
              <p>
                Where the GDPR or similar privacy laws apply, Designik Agency
                processes personal information in accordance with applicable
                legal requirements. We do not disclose personally identifiable
                information to external parties for their own marketing purposes
                without your consent.
              </p>
              <p>
                Trusted providers who help us operate our website or provide
                services may process information on our behalf where necessary,
                subject to appropriate confidentiality and data-protection
                obligations.
              </p>
              <p>
                Subject to applicable law, you may request access to personal
                data we hold about you and information about how it is used.
              </p>
            </Section>

            <Section title="Consent">
              <p>
                By providing personal information and agreeing to this Privacy
                Policy where consent is required, you give Designik Agency
                permission to process your personal data for the purposes
                described above.
              </p>
              <p>
                If sensitive personal data is requested, we will explain why it
                is needed and how it will be used when required by applicable
                law.
              </p>
              <p>
                You may withdraw consent at any time by contacting us by phone
                or email, subject to applicable legal and contractual
                requirements and the standard withdrawal procedure (GDPR DOC
                2.7A).
              </p>
            </Section>

            <Section title="Privacy Contact">
              <p>
                Questions about this Privacy Policy, your personal information,
                or SMS privacy can be directed to Designik Agency.
              </p>
              <div className="mt-5 rounded-2xl bg-cream-50 p-5 text-black/75 ring-1 ring-black/5">
                <p className="font-semibold text-wine-900">Designik Agency</p>
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
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
