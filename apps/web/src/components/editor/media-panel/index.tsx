"use client";

import { TabBar } from "./tabbar";
import { MediaView } from "./views/media";
import { useMediaPanelStore, Tab } from "./store";
import { TextView } from "./views/text";
import { SoundsView } from "./views/sounds";
import { Separator } from "@/components/ui/separator";
import { SettingsView } from "./views/settings";
import { Captions } from "./views/captions";
import { TransitionsView } from "./views/transitions";
import { AIEditingPanelNew } from "../ai-editing-panel-new";
import { AutoAIEditingProgress } from "@/components/ai-editor/auto-ai-editing-progress";
import { useParams, usePathname } from "next/navigation";

export function MediaPanel() {
  const { activeTab } = useMediaPanelStore();
  const params = useParams();
  const pathname = usePathname();
  const projectId = params?.project_id as string;

  // 检查是否在AI编辑器页面
  const isAIEditor = pathname?.includes('/ai-editor/');

  const viewMap: Record<Tab, React.ReactNode> = {
    media: isAIEditor && projectId ? (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b">
          <AutoAIEditingProgress projectId={projectId} />
        </div>
        <div className="flex-1 overflow-hidden">
          <MediaView />
        </div>
      </div>
    ) : (
      <MediaView />
    ),
    sounds: <SoundsView />,
    text: <TextView />,
    stickers: (
      <div className="p-4 text-muted-foreground">
        Stickers view coming soon...
      </div>
    ),
    effects: (
      <div className="p-4 text-muted-foreground">
        Effects view coming soon...
      </div>
    ),
    transitions: <TransitionsView />,
    captions: <Captions />,
    filters: (
      <div className="p-4 text-muted-foreground">
        Filters view coming soon...
      </div>
    ),
    adjustment: (
      <div className="p-4 text-muted-foreground">
        Adjustment view coming soon...
      </div>
    ),
    settings: <SettingsView />,
    "ai-editing": isAIEditor && projectId ? (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b">
          <AutoAIEditingProgress projectId={projectId} />
        </div>
        <div className="flex-1 overflow-hidden">
          <AIEditingPanelNew />
        </div>
      </div>
    ) : (
      <AIEditingPanelNew />
    ),
  };

  return (
    <div className="h-full flex bg-panel">
      <TabBar />
      <Separator orientation="vertical" />
      <div className="flex-1 overflow-hidden">{viewMap[activeTab]}</div>
    </div>
  );
}
