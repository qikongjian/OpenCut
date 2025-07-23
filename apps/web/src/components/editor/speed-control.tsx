// speed-control.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/speed-control.tsx
// 最后更新: 2025/7/23

// speed-control.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入本地模块
import { Slider } from "../ui/slider";
// 导入本地模块
import { Label } from "../ui/label";
// 导入本地模块
import { Button } from "../ui/button";
// 导入项目模块
import { usePlaybackStore } from "@/stores/playback-store";

// 常量定义 - 模块内部使用的固定值
const SPEED_PRESETS = [
  { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1.0 },
  { label: "1.5x", value: 1.5 },
  { label: "2x", value: 2.0 },
];

// SpeedControl 函数
// 导出组件 - 可复用的 UI 组件
export function SpeedControl() {
// 常量定义 - 模块内部使用的固定值
  const { speed, setSpeed } = usePlaybackStore();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Playback Speed</h3>
      <div className="space-y-4">
        <div className="flex gap-2">
          {SPEED_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant={speed === preset.value ? "default" : "outline"}
              className="flex-1"
              onClick={() => setSpeed(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div className="space-y-1">
          <Label>Custom ({speed.toFixed(1)}x)</Label>
          <Slider
            value={[speed]}
            min={0.1}
            max={2.0}
            step={0.1}
            onValueChange={(value) => setSpeed(value[0])}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
} 