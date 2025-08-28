import { cn } from "@/lib/utils";

interface GradientTextProps {
  text: string;
  startColor?: string;
  endColor?: string;
  startPercentage?: number;
  endPercentage?: number;
  className?: string;
  glowIntensity?: {
    primary?: number;
    secondary?: number;
  };
}

export function GradientText({
  text,
  startColor = '#6AF4F9',
  endColor = '#C73BFF',
  startPercentage = 0,
  endPercentage = 100,
  className
}: GradientTextProps) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(to right, ${startColor} ${startPercentage}%, ${endColor} ${endPercentage}%)`
      }}
    >
      {text}
    </span>
  );
}
