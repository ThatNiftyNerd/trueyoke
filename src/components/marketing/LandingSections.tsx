import type { ReactNode } from "react";

/**
 * Presentational content sections for the public "/" landing page. Split out
 * of src/routes/index.tsx to keep that route file small — nothing here reads
 * auth state or makes network calls; it's pure marketing copy plus the two
 * external download links.
 *
 * Photos are hotlinked from Unsplash (royalty-free, no attribution required)
 * and are intentionally generic/stock — never real TrueYoke member photos,
 * consistent with the product's policy of never surfacing real member photos
 * pre-match. Alt text says so explicitly for screen-reader users.
 */

const BELIEFS = [
  {
    title: "Faith comes first",
    body: "Your relationship with Christ is the foundation everything else here is built on, not a line on a profile.",
  },
  {
    title: "Serious over casual",
    body: "TrueYoke is for people who already know they want marriage, not a place to keep your options quietly open forever.",
  },
  {
    title: "Community, not just chemistry",
    body: "Your church family has a voice here. Pastors, elders, and mentors can vouch for the people you're getting to know.",
  },
  {
    title: "Trust is earned, and verified",
    body: "Verification badges mean the person you're talking to is who they say they are.",
  },
  {
    title: "Scripture sets the tone",
    body: "From the Life Verse on every profile to the culture we ask you to bring, this is a space shaped by Scripture, not just decorated with it.",
  },
];

function Section({
  eyebrow,
  title,
  children,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      className={`mx-auto w-full px-6 py-12 sm:py-14 lg:px-10 ${wide ? "max-w-5xl" : "max-w-2xl"}`}
    >
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-widest text-app-on-accent">
        {eyebrow}
      </p>
      <h2 className="mb-6 text-center font-serif text-2xl font-semibold text-app-ink sm:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SunlitImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`h-56 w-full rounded-2xl border border-app-accent/30 object-cover shadow-sm sm:h-72 ${className}`}
    />
  );
}

export function WhoThisIsFor() {
  return (
    <Section eyebrow="Who this is for" title="Open to every Christian believer" wide>
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="space-y-4 text-app-ink/80">
          <p>
            TrueYoke was built for Christian believers who are done with dating apps that treat
            marriage as an afterthought. It began inside the Church of Christ, among believers who
            felt this need most acutely — and what we built for our own community, we're now opening
            to Christians everywhere.
          </p>
          <p>
            Whatever your tradition — Church of Christ, Baptist, Catholic, Pentecostal,
            non-denominational, or otherwise — if Christ is the foundation you want your next
            relationship built on, you're welcome here. You'll feel at home if you're a single
            believer ready for marriage, a Christian professional who wants a partner who shares
            your convictions, or a pastor, elder, deacon, or other church leader willing to vouch
            for the character of those you know.
          </p>
        </div>
        <SunlitImage
          src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=70"
          alt="Two people's silhouetted hands forming a heart shape against a warm sunset — a generic stock photo, not an actual TrueYoke member"
          className="lg:h-80"
        />
      </div>
    </Section>
  );
}

export function WhatWeBelieve() {
  return (
    <Section eyebrow="What we believe" title="Five convictions shape how this works" wide>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BELIEFS.map((b) => (
          <div
            key={b.title}
            className="rounded-xl border border-app-accent/40 bg-app-surface p-4 shadow-sm"
          >
            <h3 className="mb-1 font-serif text-base text-app-on-accent">{b.title}</h3>
            <p className="text-sm text-app-ink/70">{b.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function TwoWaysToJoin() {
  return (
    <Section eyebrow="Joining" title="Two ways to join" wide>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-app-accent/40 bg-app-surface p-4">
            <h3 className="mb-1 font-serif text-base text-app-ink">Match</h3>
            <p className="text-sm text-app-ink/70">
              A single believer, marriage-minded, ready to be known — sharing your story, your
              values, your Life Verse, and, when you're ready, your voice.
            </p>
          </div>
          <div className="rounded-xl border border-app-accent/40 bg-app-surface p-4">
            <h3 className="mb-1 font-serif text-base text-app-ink">Mentor</h3>
            <p className="text-sm text-app-ink/70">
              A pastor, elder, deacon, or other recognized church leader providing the kind of
              accountability a dating app can't fake.
            </p>
          </div>
        </div>
        <SunlitImage
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=70"
          alt="Three women laughing together over laptops at a table — a generic stock photo representing community, not actual TrueYoke members"
          className="lg:h-full"
        />
      </div>
    </Section>
  );
}

export function TrustAndSafety() {
  return (
    <Section eyebrow="Trust &amp; safety" title="Vouched for, verified, and yours to control" wide>
      <div className="relative overflow-hidden rounded-2xl border border-app-accent/30">
        <img
          src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=60"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative space-y-4 bg-app-surface/90 p-6 text-app-ink/80 sm:p-8">
          <p>
            Every Match can invite a Voucher — a pastor, elder, deacon, or other church leader who
            knows them — to submit a short endorsement that appears right on their profile.
            Verification badges confirm you are who your ID says you are, and that your church
            affiliation is real.
          </p>
          <p>
            Your photos and voice stay private and are never posted to the open internet. Anything
            sensitive is only ever collected after you've clearly agreed to share it. You can export
            or permanently delete everything you've shared in one tap, and reporting or blocking is
            always one tap away.
          </p>
        </div>
      </div>
    </Section>
  );
}

export function GetTheApp({ apkUrl }: { apkUrl: string }) {
  return (
    <Section eyebrow="Get the app" title="Try TrueYoke on Android today">
      <div className="space-y-4">
        <p className="text-center text-sm text-app-ink/70">
          We're in early testing — this is a signed build straight from our build pipeline, ahead of
          an official Play Store listing.
        </p>
        <a
          href={apkUrl}
          className="block w-full rounded-md border-2 border-app-accent bg-app-surface px-6 py-3 text-center font-medium text-app-on-accent transition-colors hover:bg-app-accent/10"
        >
          Download the Android APK (testing build)
        </a>
        <div className="flex items-center justify-center gap-2 text-sm text-app-ink/50">
          <span className="rounded-full border border-app-accent/40 px-3 py-1">
            iOS — coming soon
          </span>
        </div>
      </div>
    </Section>
  );
}
