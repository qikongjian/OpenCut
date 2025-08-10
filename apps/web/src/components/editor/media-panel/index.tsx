// index.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/media-panel/index.tsx
// 最后更新: 2025/7/23

// index.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入标签栏组件，用于切换不同的媒体类型
import { TabBar } from "./tabbar";
// 导入媒体视图组件，显示视频和图片文件
import { MediaView } from "./views/media";
// 导入媒体面板状态管理
import { useMediaPanelStore, Tab } from "./store";
// 导入文本视图组件，用于添加和编辑文本元素
import { TextView } from "./views/text";
// 导入音频视图组件，显示音频文件
import { AudioView } from "./views/audio";
// 导入转场视图组件，显示转场效果
import { TransitionsView } from "./views/transitions";
// 导入特效视图组件，显示蒙板和特效
import { EffectsView } from "./views/effects";
// 导入AI剪辑面板组件
import { AIEditingPanel } from "../ai-editing-panel";
// 导入AI字幕面板组件
import { AISubtitlePanel } from "../ai-subtitle-panel";

// 媒体面板组件 - 编辑器左侧的媒体资源管理面板
// 导出组件 - 可复用的 UI 组件

// MediaPanel 组件 - 可复用的 UI 组件，可以在其他文件中导入使用
export function MediaPanel() {
  // 获取当前激活的标签页
  const { activeTab } = useMediaPanelStore();

  // 定义标签页与对应视图组件的映射关系
  const viewMap: Record<Tab, React.ReactNode> = {
    // 媒体标签页 - 显示视频和图片文件
    media: <MediaView />,
    // 音频标签页 - 显示音频文件
    audio: <AudioView />,
    // 文本标签页 - 添加和编辑文本元素
    text: <TextView />,
    // 贴纸标签页 - 暂未实现
    stickers: (
      <div className="p-4 text-muted-foreground">
        Stickers view coming soon...
      </div>
    ),
    // 特效标签页 - 蒙板和特效管理
    effects: <EffectsView />,
    // 转场标签页 - 显示转场效果
    transitions: <TransitionsView />,
    // 字幕标签页 - AI字幕集成功能
    captions: <AISubtitlePanel />,
    // 滤镜标签页 - 暂未实现
    filters: (
      <div className="p-4 text-muted-foreground">
        Filters view coming soon...
      </div>
    ),
    // 调整标签页 - 暂未实现
    adjustment: (
      <div className="p-4 text-muted-foreground">
        Adjustment view coming soon...
      </div>
    ),
    // AI剪辑标签页 - AI智能剪辑功能
    "ai-editing": <AIEditingPanel />,
  };

  return (
    // 媒体面板容器 - 使用面板背景色，支持滚动
    <div className="h-full flex flex-col bg-panel rounded-sm overflow-hidden">
      {/* 标签栏 - 用于切换不同的媒体类型 */}
      <TabBar />
      {/* 内容区域 - 根据当前标签页显示对应的视图 */}
      <div className="flex-1">{viewMap[activeTab]}</div>
    </div>
  );
}
