"use client";

import { motion } from "framer-motion";

/**
 * Continuous crane-pendulum swing for the hanging tags. Pivots at the top
 * (where the claw grips), sinusoidal ease like a real pendulum, slow.
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
  return (
    <motion.div
      className={className}
      animate={{ rotate: [angle, -angle, angle] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "50% 0%" }}
    >
      {children}
    </motion.div>
  );
}
