import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Reveal, RevealItem, riseItem } from "./motion";

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
 *
 * Motion lives in ./motion.tsx and is scroll-triggered once per section; the
 * page-level <MotionConfig reducedMotion="user"> makes all of it respect the
 * visitor's OS reduce-motion preference.
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
    <Reveal
      as="section"
      className={`mx-auto w-full px-6 py-12 sm:py-14 lg:px-10 ${wide ? "max-w-5xl" : "max-w-2xl"}`}
    >
      <motion.p
        variants={riseItem}
        className="mb-2 text-center text-xs font-medium uppercase tracking-widest text-app-on-accent"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={riseItem}
        className="mb-6 text-center font-serif text-2xl font-semibold text-app-ink sm:text-3xl"
      >
        {title}
      </motion.h2>
      <RevealItem>{children}</RevealItem>
    </Reveal>
  );
}

type PhotoCredit = {
  name: string;
  profileUrl: string;
  photoUrl: string;
};

function SunlitImage({
  src,
  alt,
  className = "",
  credit,
}: {
  src: string;
  alt: string;
  className?: string;
  credit?: PhotoCredit;
}) {
  // Subtle parallax: the photo drifts a few percent slower than the page.
  const frameRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: frameRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <figure className="m-0">
      <div
        ref={frameRef}
        className={`h-56 w-full overflow-hidden rounded-2xl border border-app-accent/30 shadow-sm sm:h-72 ${className}`}
      >
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          style={{ y }}
          className="h-[115%] w-full object-cover will-change-transform"
        />
      </div>
      {credit && (
        <figcaption className="mt-1 text-right text-xs text-app-ink/50">
          Photo by{" "}
          <a
            href={credit.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-app-ink/30 hover:text-app-ink/80"
          >
            {credit.name}
          </a>{" "}
          on{" "}
          <a
            href={credit.photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-app-ink/30 hover:text-app-ink/80"
          >
            Unsplash
          </a>
        </figcaption>
      )}
    </figure>
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
            felt this need most acutely, and what we built for our own community, we're now opening
            to Christians everywhere.
          </p>
          <p>
            Whatever your tradition (Church of Christ, Baptist, Catholic, Pentecostal,
            non-denominational, or otherwise), if Christ is the foundation you want your next
            relationship built on, you're welcome here. You'll feel at home if you're a single
            believer ready for marriage, a Christian professional who wants a partner who shares
            your convictions, or a pastor, elder, deacon, or other church leader willing to vouch
            for the character of those you know.
          </p>
        </div>
        <SunlitImage
          src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=70"
          alt="Two people's silhouetted hands forming a heart shape against a warm sunset, a generic stock photo, not an actual TrueYoke member"
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
          <motion.div
            key={b.title}
            tabIndex={0}
            whileHover={{ y: -6, boxShadow: "0 18px 40px -18px var(--app-accent)" }}
            whileFocus={{ y: -6, boxShadow: "0 18px 40px -18px var(--app-accent)" }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="rounded-xl border border-app-accent/40 bg-app-surface p-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
          >
            <h3 className="mb-1 font-serif text-base text-app-on-accent">{b.title}</h3>
            <p className="text-sm text-app-ink/70">{b.body}</p>
          </motion.div>
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
              A single believer, marriage-minded, ready to be known: sharing your story, your
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
          src="https://images.unsplash.com/photo-1592599457454-e6ace3370314?auto=format&fit=crop&w=900&q=70"
          alt="A Black man in a cap tenderly kissing a woman's forehead outdoors, a generic stock photo, not actual TrueYoke members"
          className="lg:h-full"
          credit={{
            name: "LaShawn Dobbs",
            profileUrl:
              "https://unsplash.com/@lashawndobbs?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText",
            photoUrl:
              "https://unsplash.com/photos/man-in-black-crew-neck-t-shirt-kissing-woman-in-white-dress-Qx-jCqiTezY?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText",
          }}
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
            Every Match can invite a Voucher (a pastor, elder, deacon, or other church leader who
            knows them) to submit a short endorsement that appears right on their profile.
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

// Brand marks (path data from Simple Icons, CC0), inlined as SVG so the
// store buttons carry the platforms' own logos without a runtime
// dependency on a third-party icon CDN.
function AndroidLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z" />
    </svg>
  );
}

function AppleLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

export function GetTheApp({ apkUrl }: { apkUrl: string }) {
  return (
    <Section eyebrow="Get the app" title="Try TrueYoke on Android today">
      <div className="space-y-4">
        <p className="text-center text-sm text-app-ink/70">
          We're in early testing. This is a signed build straight from our build pipeline, ahead of
          an official Play Store listing.
        </p>
        <motion.a
          href={apkUrl}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-app-accent bg-app-surface px-6 py-3 text-center font-medium text-app-on-accent transition-colors hover:bg-app-accent/10"
        >
          <AndroidLogo className="h-5 w-5 shrink-0" />
          Download the Android APK (testing build)
        </motion.a>
        <div className="flex items-center justify-center gap-2 text-sm text-app-ink/50">
          <span className="flex items-center gap-1.5 rounded-full border border-app-accent/40 px-3 py-1">
            <AppleLogo className="h-4 w-4 shrink-0" />
            iOS, coming soon
          </span>
        </div>
      </div>
    </Section>
  );
}
