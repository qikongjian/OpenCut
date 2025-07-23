// font-picker.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/font-picker.tsx
// 最后更新: 2025/7/23

// font-picker.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入模块
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// 导入项目模块
import { FONT_OPTIONS, FontFamily } from "@/constants/font-constants";

// FontPickerProps 接口定义
interface FontPickerProps {
  defaultValue?: FontFamily;
  onValueChange?: (value: FontFamily) => void;
  className?: string;
}

// FontPicker 函数
// 导出组件 - 可复用的 UI 组件
export function FontPicker({
  defaultValue,
  onValueChange,
  className,
}: FontPickerProps) {
  return (
    <Select defaultValue={defaultValue} onValueChange={onValueChange}>
      <SelectTrigger className={`w-full text-xs ${className || ""}`}>
        <SelectValue placeholder="Select a font" />
      </SelectTrigger>
      <SelectContent>
        {FONT_OPTIONS.map((font) => (
          <SelectItem
            key={font.value}
            value={font.value}
            className="text-xs"
            style={{ fontFamily: font.value }}
          >
            {font.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
