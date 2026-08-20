import { createFileRoute, Link } from "@tanstack/react-router";
import { CopyrightNotice } from "@/components/app/CopyrightNotice";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — TrueYoke" },
      {
        name: "description",
        content: "The terms that govern your use of TrueYoke.",
      },
      { property: "og:title", content: "Terms of Service — TrueYoke" },
      {
        property: "og:description",
        content: "The terms that govern your use of TrueYoke.",
      },
    ],
  }),
  component: TermsScreen,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-serif text-lg text-app-ink">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-app-ink/80">{children}</div>
    </section>
  );
}

function TermsScreen() {
  return (
    <main className="min-h-[100dvh] bg-app-canvas px-6 py-10">
      <article className="mx-auto w-full max-w-2xl">
        <header>
          <h1 className="font-serif text-2xl text-app-ink">TRUEYOKE TERMS OF SERVICE</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-app-ink/60">
            Last updated: 19 August 2026
          </p>
        </header>

        <p className="mt-6 text-sm leading-relaxed text-app-ink/80">
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of TrueYoke, a
          mobile application operated by House603 Digital Solutions (&ldquo;House603,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo;). By creating an account, you agree to these Terms and
          to our{" "}
          <Link to="/privacy" className="underline">
            Privacy Policy
          </Link>
          , which is incorporated by reference. If you do not agree, please do not use TrueYoke.
        </p>

        <Section title="1. What TrueYoke is">
          <p>
            TrueYoke exists to help marriage-minded members of the Church of Christ and like-minded
            conservative Christian communities meet with purpose, and to let respected members of
            those communities serve as mentors who can vouch for and guide the people they know. It
            is a space built around a shared conviction &mdash; &ldquo;do not be unequally
            yoked&rdquo; (2 Corinthians 6:14) &mdash; not a general-purpose dating app repurposed
            for a niche audience.
          </p>
          <p>
            You do not have to belong to any specific congregation to create an account. Church
            affiliation, congregation, and church verification are things you tell us about yourself
            and, if you choose, have confirmed by an administrator &mdash; they shape how you
            present and who you're likely to connect well with, not a legal condition of using the
            app.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 18 years old to create a TrueYoke account. We require you to
            confirm your age at sign-up and reject profiles outside our accepted range, though we do
            not currently verify age against a government-issued document unless you complete
            optional identity verification. You must provide accurate information and keep it
            current; you may only maintain one account, in your own identity &mdash; accounts must
            not be created on behalf of someone else or under a false name.
          </p>
        </Section>

        <Section title="3. The service, as it actually works">
          <p>
            Discovery &amp; matching: you can review other members' profiles and choose to connect.
            Active matches are capped and automatically expire after a period of inactivity &mdash;
            these limits exist to keep conversations intentional, and are enforced by the database,
            not just the app's interface.
          </p>
          <p>
            Messaging: once matched, you can message each other within the app. Messages are private
            to the two people in that match, other than what safety review requires (see Section 6).
          </p>
          <p>
            Mentor accounts &amp; vouchers: some members register as mentors rather than as
            match-seekers. Mentors can be selected by match-seeking members and can issue
            endorsements. A mentor's endorsement reflects that individual's personal opinion &mdash;
            it is not verified or guaranteed by TrueYoke, and we are not a party to, and take no
            responsibility for, any relationship, courtship, or outcome that follows from it.
          </p>
          <p>
            ID and church verification: both are optional, self-initiated features reviewed by a
            human administrator. A verification badge means an administrator found the submitted
            document or information credible &mdash; it is <strong>not</strong> a criminal
            background check, a confirmation of someone's character or intentions, or a guarantee of
            your safety in meeting them. Use the same judgment meeting anyone from TrueYoke that you
            would meeting anyone else.
          </p>
        </Section>

        <Section title="4. Your account">
          <p>
            You're responsible for the activity on your account and for keeping your credentials
            confidential. Tell us immediately at support@trueyoke.app if you believe your account
            has been accessed without your permission. We offer step-up verification on password
            recovery as an added safeguard, but the account itself remains your responsibility.
          </p>
        </Section>

        <Section title="5. Community standards">
          <p>
            TrueYoke is a space for good-faith, respectful pursuit of marriage-minded relationships
            and mentorship consistent with that purpose. You agree not to: harass, threaten, or
            deceive other members; post or send sexually explicit, hateful, or violent content;
            misrepresent your identity, age, marital status, or intentions; solicit money, business,
            or any commercial arrangement through the app; or use TrueYoke for anything unlawful.
          </p>
          <p>
            If another member makes you uncomfortable or violates these standards, you can block or
            report them directly from their profile. We review reports and may warn, suspend, or
            permanently remove any account at our discretion, with or without notice, when we
            believe it protects other members.
          </p>
        </Section>

        <Section title="6. Content you share">
          <p>
            You keep ownership of your profile content &mdash; photos, bio, life verse, voice
            introduction, and anything else you add. By posting it, you give House603 a limited
            license to store, display, and transmit it within TrueYoke solely to operate the service
            for you (for example, showing your photo to a match). We don't sell your content or use
            it for anything outside the app. This license ends when you delete the content or your
            account, other than copies we're required to retain for the limited safety-review period
            described in our Privacy Policy.
          </p>
          <p>You're responsible for making sure you have the right to share whatever you upload.</p>
        </Section>

        <Section title="7. Cost">
          <p>
            TrueYoke is currently free to use. If we introduce paid tiers or features in the future,
            we'll tell you clearly before you're asked to pay, and update these Terms accordingly
            &mdash; nothing you're using today will silently start costing money.
          </p>
        </Section>

        <Section title="8. Suspension &amp; deletion">
          <p>
            You can delete your own account at any time from Settings → Delete my account. This
            permanently removes your profile, photos, matches, and messages, as described in our{" "}
            <Link to="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
          <p>
            We may suspend or terminate your account if you violate these Terms, misuse the service,
            or create risk for other members. Where practical we'll tell you why; for urgent safety
            situations we may act first and explain afterward.
          </p>
        </Section>

        <Section title="9. No guarantees">
          <p>
            TrueYoke helps you meet people &mdash; it can't promise you'll find a match, that a
            match or mentor endorsement will lead anywhere in particular, or that every member is
            who they claim to be. The service is provided &ldquo;as is,&rdquo; without warranties of
            any kind, to the fullest extent the law allows.
          </p>
        </Section>

        <Section title="10. Limitation of liability">
          <p>
            To the fullest extent permitted by law, House603 is not liable for indirect, incidental,
            or consequential damages arising from your use of TrueYoke, or from the conduct of any
            member you meet through it &mdash; online or in person. Nothing in these Terms limits
            liability that cannot be limited under Nigerian law.
          </p>
        </Section>

        <Section title="11. Governing law">
          <p>
            These Terms are governed by the laws of the Federal Republic of Nigeria. Any dispute
            arising from these Terms or your use of TrueYoke will be subject to the exclusive
            jurisdiction of the courts of Nigeria.
          </p>
        </Section>

        <Section title="12. Changes to these Terms">
          <p>
            We may update these Terms as TrueYoke grows. We'll post material changes here with an
            updated date, and where a change meaningfully affects your rights, we'll ask you to
            re-accept before you can keep using the app.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            Questions about these Terms: support@trueyoke.app. Privacy-specific questions go to our
            Data Protection Officer at privacy@trueyoke.app, per our{" "}
            <Link to="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </Section>

        <p className="mt-8 text-center text-sm">
          <Link to="/" className="text-app-ink/70 underline">
            Back to TrueYoke
          </Link>
        </p>

        <CopyrightNotice className="mt-6" />
      </article>
    </main>
  );
}
