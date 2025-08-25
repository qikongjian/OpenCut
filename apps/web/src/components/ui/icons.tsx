import { forwardRef } from "react";
import { LucideProps } from "lucide-react";

export const CustomFlipHorizontal = forwardRef<SVGSVGElement, LucideProps>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* 左侧三角形 */}
      <path
        d="M1 4L4 8L1 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 右侧三角形 */}
      <path
        d="M15 4L12 8L15 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 中间的垂直线 */}
      <path
        d="M8 2L8 14"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
);

CustomFlipHorizontal.displayName = "CustomFlipHorizontal";
