"use client";

import { useEditorStore } from "@/stores/editor-store";
import Image from "next/image";

function TikTokGuide() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Image
        src="/platform-guides/tiktok-blueprint.png"
        alt="TikTok layout guide"
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
        fill
      />
    </div>
  );
}

export function LayoutGuideOverlay() {
  const { layoutGuide } = useEditorStore();

  // 🚀 隐藏所有布局指南，包括抖音指南
  return null;

  // 原始代码（已禁用）
  // if (layoutGuide.platform === null) return null;
  // if (layoutGuide.platform === "tiktok") return <TikTokGuide />;
  // return null;
}
