"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/**
 * Continuous crane-pendulum swing for the hanging tags. Pivots at the top
 * (where the claw grips), sinusoidal ease like a real pendulum, slow.
 * Pauses while scrolled out of view so it costs nothing off-screen.
 */
export default function PendulumSwing({
  className,
  children,
  angle = 3.2,
  duration = 4.2,
}: {
  className?: string;
  children: React.ReactNode;
  angle?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "15% 0px 15% 0px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      animate={inView ? { rotate: [angle, -angle, angle] } : { rotate: angle }}
      transition={inView ? { duration, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      style={{ transformOrigin: "50% 0%" }}
    >
      {children}
    </motion.div>
  );
}
