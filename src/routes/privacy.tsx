import { createFileRoute, Link } from "@tanstack/react-router";
import { CopyrightNotice } from "@/components/app/CopyrightNotice";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TrueYoke" },
      {
        name: "description",
        content:
          "How TrueYoke collects, uses, and protects your personal data under the Nigeria Data Protection Act, 2023.",
      },
      { property: "og:title", content: "Privacy Policy — TrueYoke" },
      {
        property: "og:description",
        content:
          "How TrueYoke collects, uses, and protects your personal data under the Nigeria Data Protection Act, 2023.",
      },
    ],
  }),
  component: PrivacyScreen,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-serif text-lg text-app-ink">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-app-ink/80">{children}</div>
    </section>
  );
}

function PrivacyScreen() {
  return (
    <main className="min-h-[100dvh] bg-app-canvas px-6 py-10">
      <article className="mx-auto w-full max-w-2xl">
        <header>
          <h1 className="font-serif text-2xl text-app-ink">TRUEYOKE PRIVACY POLICY</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-app-ink/60">
            Last updated: 20 August 2026
          </p>
        </header>

        <p className="mt-6 text-sm leading-relaxed text-app-ink/80">
          TrueYoke is operated by House603 Digital Solutions (&ldquo;House603,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo;). This policy explains what personal data TrueYoke
          collects, why, how it is protected, and the rights you have over it under the Nigeria Data
          Protection Act, 2023 (&ldquo;NDPA&rdquo;).
        </p>

        <Section title="1. Who we are">
          <p>
            House603 Digital Solutions is the data controller for TrueYoke. For any privacy question
            or to exercise a right described below, contact our Data Protection Officer at
            privacy@trueyoke.app.
          </p>
        </Section>

        <Section title="2. What we collect">
          <p>
            Account data: email address, authentication method (email/password or Google sign-in).
          </p>
          <p>
            Profile data: display name, age (self-reported, 18+ required at sign-up), gender,
            location label, occupation, qualification, bio, and marriage intentions.
          </p>
          <p>
            Sensitive personal data (the NDPA, GDPR, and similar laws worldwide give this extra
            protection — we only process it with your separate, explicit consent, captured in a
            dedicated consent step during onboarding, distinct from your acceptance of this Privacy
            Policy): genotype and blood group; church affiliation, congregation, spirituality
            markers, and life verse (religious belief); your uploaded profile photos and voice
            introduction (biometric-adjacent data); government-issued ID image, if you choose to
            complete identity verification.
          </p>
          <p>
            Usage data: who you swipe on, match with, message, block, or report, generated
            automatically as you use the app.
          </p>
        </Section>

        <Section title="3. Why we process it">
          <p>
            To operate the core matching and messaging service (contractual necessity). To verify
            age eligibility and, optionally, identity and church affiliation (consent; legitimate
            interest in community safety). To enforce blocking, reporting, and moderation so members
            can use TrueYoke safely (legitimate interest). To process the sensitive personal data
            listed above only with your separate, explicit consent.
          </p>
        </Section>

        <Section title="4. Who processes it on our behalf">
          <p>
            TrueYoke's database, authentication, and file storage are hosted by Supabase, our
            infrastructure processor, on servers located in the European Union (AWS eu-north-1,
            Stockholm, Sweden). Because this is outside Nigeria, the transfer is subject to the
            NDPA's cross-border transfer rules. We rely on our processor's contractual
            data-protection commitments as the transfer safeguard while we complete a formal
            adequacy assessment and documentation for this transfer.
          </p>
        </Section>

        <Section title="5. How long we keep it">
          <p>
            We retain your data for as long as your account is active. If you delete your account,
            your profile, photos, voice introduction, matches, messages, and verification documents
            are permanently deleted, other than records we are legally required to retain (for
            example, safety reports, kept for a limited period to protect other members).
          </p>
        </Section>

        <Section title="6. How we protect it">
          <p>
            Access to your data is restricted at the database level so only you (and, for
            safety-relevant records, authorized moderators) can read it. Photos, voice
            introductions, and ID documents are stored in private, access-controlled storage, never
            public URLs. All connections use encrypted transport (HTTPS/TLS).
          </p>
        </Section>

        <Section title="7. If something goes wrong">
          <p>
            If we become aware of a personal data breach that is likely to result in a risk to your
            rights and freedoms, we will notify the relevant supervisory authority without undue
            delay (within the timeframe required by applicable law — for example, 72 hours under the
            GDPR, or as soon as reasonably practicable under the NDPA) and, where the breach is
            likely to result in a high risk to you, notify you directly without undue delay,
            describing what happened, the data involved, and the steps we are taking.
          </p>
        </Section>

        <Section title="8. Your rights">
          <p>
            Under the NDPA you have the right to: access the personal data we hold about you;
            correct inaccurate data (edit your profile at any time); delete your account and
            associated data (Settings → Delete my account); export a copy of your data (Settings →
            Download my data); withdraw consent for sensitive data processing at any time; object to
            processing based on legitimate interest. To exercise any right not available directly
            in-app, contact privacy@trueyoke.app.
          </p>
        </Section>

        <Section title="9. Children">
          <p>
            TrueYoke is not for anyone under 18. We require you to confirm your age at sign-up and
            reject profiles outside our accepted range; we do not currently verify age against a
            government-issued document unless you complete optional identity verification.
          </p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>
            We will post material changes here with an updated date, and where changes affect how we
            use sensitive personal data, ask for renewed consent before you can continue using
            TrueYoke.
          </p>
        </Section>

        <Section title="11. Notice for California residents (CCPA/CPRA)">
          <p>
            If you are a California resident, the CCPA (as amended by the CPRA) gives you additional
            rights over your personal information, several of which overlap with the NDPA rights
            described above.
          </p>
          <p>
            <strong>Categories collected and why:</strong> identifiers (email, account ID);
            characteristics (age, gender); commercial/usage information (matches, messages, swipes);
            geolocation (location label, city, country); sensory data (voice introduction);
            professional information (occupation, qualification); and sensitive personal information
            — health-adjacent (genotype, blood group), religious belief (church affiliation,
            congregation, spirituality markers, life verse), and government ID (identity
            verification only). Each category is collected for the purposes described in Section 3
            above; we do not use sensitive personal information to infer characteristics about you
            beyond operating the matching service you signed up for.
          </p>
          <p>
            <strong>We do not sell or share your personal information</strong> for cross-context
            behavioral advertising, and we have not done so in the preceding 12 months.
          </p>
          <p>
            You have the right to know what personal information we hold about you, delete it,
            correct it, and limit our use of sensitive personal information to what is necessary to
            provide TrueYoke. You can exercise the access, deletion, and correction rights directly
            in-app (Settings → Download my data / Delete my account / edit your profile), or by
            contacting privacy@trueyoke.app. We will not discriminate against you for exercising any
            of these rights.
          </p>
        </Section>

        <p className="mt-8 text-center text-sm">
          <Link to="/terms" className="text-app-ink/70 underline">
            Terms of Service
          </Link>
          {" · "}
          <Link to="/" className="text-app-ink/70 underline">
            Back to TrueYoke
          </Link>
        </p>

        <CopyrightNotice className="mt-6" />
      </article>
    </main>
  );
}
