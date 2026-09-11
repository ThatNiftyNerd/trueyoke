import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";

/**
 * Shared motion primitives for the public landing page only.
 *
 * Everything here is presentation-only: no data, no auth, no network. The
 * page wraps its content in <MotionConfig reducedMotion="user">, so these
 * variants automatically collapse to opacity-only for visitors whose OS
 * asks for reduced motion — no per-animation handling needed.
 */

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Parent: staggers its children in, once, when scrolled into view. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

/** Child: fade + slide up. */
export const riseItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

/**
 * Fade-and-slide-up a block the first time it enters the viewport, with its
 * children staggering in rather than all landing at once.
 */
export function Reveal({
  children,
  className = "",
  as = "div",
  amount = 0.2,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  amount?: number;
}) {
  const Comp = as === "section" ? motion.section : motion.div;
  return (
    <Comp
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </Comp>
  );
}

/** A single staggered child inside <Reveal>. */
export function RevealItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={riseItem}>
      {children}
    </motion.div>
  );
}
