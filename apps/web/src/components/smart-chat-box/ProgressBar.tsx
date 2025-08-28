import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  total?: number;
  label?: string;
}

export function ProgressBar({ value, total = 100, label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round((value / total) * 100)));
  return (
    <div className="my-2" data-alt="progress-bar">
      {label ? <div className="mb-1 text-xs opacity-80">{label}</div> : null}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-2 bg-green-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="text-[10px] mt-1 opacity-70">{pct}%</div>
    </div>
  );
}
