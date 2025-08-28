import { motion } from "framer-motion";

export const uid = () => Math.random().toString(36).slice(2);

export const bubbleVariants = {
  hidden: (isUser: boolean) => ({ opacity: 0, x: isUser ? 40 : -40, scale: 0.98 }),
  visible: { opacity: 1, x: 0, scale: 1 },
};

// Format a time like 10:24
export function hhmm(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}
