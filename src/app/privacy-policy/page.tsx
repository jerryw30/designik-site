import type { Metadata } from "next";
import Nav from "@/components/sections/Nav";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Designik Agency",
  description:
    "Privacy Policy for Designik Agency, including how we collect, use, protect, and handle personal information and SMS opt-in data.",
  alternates: {
    canonical: "/privacy-policy",
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

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
              This Privacy Policy explains how Designik Agency collects, uses,
              protects, and handles personal information when you interact with
              our website, services, and communications.
            </p>
            <p className="mt-5 text-sm text-white/50">
              Effective date: September 28, 2026
            </p>
          </div>
        </header>

        <div className="px-5 py-14 md:px-8 md:py-20">
          <article className="mx-auto max-w-4xl rounded-[28px] bg-white px-6 py-8 shadow-[0_24px_80px_rgba(83,8,35,0.08)] ring-1 ring-black/5 sm:px-10 md:px-14 md:py-12">
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

            <Section title="Contact Designik Agency">
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
