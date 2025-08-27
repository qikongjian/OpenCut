"use client";

import { useGlobalPrefetcher } from "@/components/providers/global-prefetcher";

export default function AIEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useGlobalPrefetcher();

  return <div>{children}</div>;
}
