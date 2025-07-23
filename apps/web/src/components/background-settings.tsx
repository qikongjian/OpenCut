// background-settings.tsx - React 组件
// 此文件包含 react 组件 的相关代码
// 文件路径: components/background-settings.tsx
// 最后更新: 2025/7/23

// background-settings.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入本地模块
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
// 导入本地模块
import { Button } from "./ui/button";
// 导入本地模块
import { BackgroundIcon } from "./icons";
// 导入项目模块
import { cn } from "@/lib/utils";
// 导入 Next.js 相关模块
import Image from "next/image";
// 导入项目模块
import { colors } from "@/data/colors";
// 导入项目模块
import { useProjectStore } from "@/stores/project-store";
// 导入 React 核心库
import { PipetteIcon } from "lucide-react";

// BackgroundTab 类型定义
type BackgroundTab = "color" | "blur";

// BackgroundSettings 函数
// 导出组件 - 可复用的 UI 组件
export function BackgroundSettings() {
// 常量定义 - 模块内部使用的固定值
  const { activeProject, updateBackgroundType } = useProjectStore();

  // ✅ Good: derive activeTab from activeProject during rendering
  const activeTab = activeProject?.backgroundType || "color";

// handleColorSelect 函数
  const handleColorSelect = (color: string) => {
    updateBackgroundType("color", { backgroundColor: color });
  };

// handleBlurSelect 函数
  const handleBlurSelect = (blurIntensity: number) => {
    updateBackgroundType("blur", { blurIntensity });
  };

// 常量定义 - 模块内部使用的固定值
  const tabs = [
    {
      label: "Color",
      value: "color",
    },
    {
      label: "Blur",
      value: "blur",
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="text"
          size="icon"
          className="!size-4 border border-muted-foreground"
        >
          <BackgroundIcon className="!size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col items-start w-[20rem] h-[16rem] overflow-hidden p-0">
        <div className="flex items-center justify-between w-full gap-2 z-10 bg-popover p-3">
          <h2 className="text-sm">Background</h2>
          <div className="flex items-center gap-2 text-sm">
            {tabs.map((tab) => (
              <span
                key={tab.value}
                onClick={() => {
                  // Switch to the background type when clicking tabs
                  if (tab.value === "color") {
                    updateBackgroundType("color", {
                      backgroundColor:
                        activeProject?.backgroundColor || "#000000",
                    });
                  } else {
                    updateBackgroundType("blur", {
                      blurIntensity: activeProject?.blurIntensity || 8,
                    });
                  }
                }}
                className={cn(
                  "text-muted-foreground cursor-pointer",
                  activeTab === tab.value && "text-foreground"
                )}
              >
                {tab.label}
              </span>
            ))}
          </div>
        </div>
        {activeTab === "color" ? (
          <ColorView
            selectedColor={activeProject?.backgroundColor || "#000000"}
            onColorSelect={handleColorSelect}
          />
        ) : (
          <BlurView
            selectedBlur={activeProject?.blurIntensity || 8}
            onBlurSelect={handleBlurSelect}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

// ColorView 函数
function ColorView({
  selectedColor,
  onColorSelect,
}: {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}) {
  return (
    <div className="w-full h-full">
      <div className="absolute top-8 left-0 w-[calc(100%-1rem)] h-12 bg-gradient-to-b from-popover to-transparent pointer-events-none"></div>
      <div className="grid grid-cols-4 gap-2 w-full h-full p-3 pt-0 overflow-auto">
        <div className="w-full aspect-square rounded-sm cursor-pointer border border-foreground/15 hover:border-primary flex items-center justify-center">
          <PipetteIcon className="size-4" />
        </div>
        {colors.map((color) => (
          <ColorItem
            key={color}
            color={color}
            isSelected={color === selectedColor}
            onClick={() => onColorSelect(color)}
          />
        ))}
      </div>
    </div>
  );
}

// ColorItem 函数
function ColorItem({
  color,
  isSelected,
  onClick,
}: {
  color: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "w-full aspect-square rounded-sm cursor-pointer hover:border-2 hover:border-primary",
        isSelected && "border-2 border-primary"
      )}
      style={{ backgroundColor: color }}
      onClick={onClick}
    />
  );
}

// BlurView 函数
function BlurView({
  selectedBlur,
  onBlurSelect,
}: {
  selectedBlur: number;
  onBlurSelect: (blurIntensity: number) => void;
}) {
// 常量定义 - 模块内部使用的固定值
  const blurLevels = [
    { label: "Light", value: 4 },
    { label: "Medium", value: 8 },
    { label: "Heavy", value: 18 },
  ];
// 常量定义 - 模块内部使用的固定值
  const blurImage =
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  return (
    <div className="grid grid-cols-3 gap-2 w-full p-3 pt-0">
      {blurLevels.map((blur) => (
        <div
          key={blur.value}
          className={cn(
            "w-full aspect-square rounded-sm cursor-pointer hover:border-2 hover:border-primary relative overflow-hidden",
            selectedBlur === blur.value && "border-2 border-primary"
          )}
          onClick={() => onBlurSelect(blur.value)}
        >
          <Image
            src={blurImage}
            alt={`Blur preview ${blur.label}`}
            fill
            className="object-cover"
            style={{ filter: `blur(${blur.value}px)` }}
          />
          <div className="absolute bottom-1 left-1 right-1 text-center">
            <span className="text-xs text-white bg-black/50 px-1 rounded">
              {blur.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
