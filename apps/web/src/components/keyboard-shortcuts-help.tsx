// keyboard-shortcuts-help.tsx - React 组件
// 此文件包含 react 组件 的相关代码
// 文件路径: components/keyboard-shortcuts-help.tsx
// 最后更新: 2025/7/23

// keyboard-shortcuts-help.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import { useState, useEffect } from "react";
// 导入本地模块
import { Button } from "./ui/button";
// 导入模块
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
// 导入项目模块
import { getPlatformSpecialKey } from "@/lib/utils";
// 导入 React 核心库
import { Keyboard } from "lucide-react";
// 导入模块
import {
  useKeyboardShortcutsHelp,
  KeyboardShortcut,
} from "@/hooks/use-keyboard-shortcuts-help";
// 导入项目模块
import { useKeybindingsStore } from "@/stores/keybindings-store";
// 导入 Sonner 通知组件
import { toast } from "sonner";

// 常量定义 - 模块内部使用的固定值
const modifier: {
  [key: string]: string;
} = {
  Shift: "Shift",
  Alt: "Alt",
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Space: "Space",
};

// getKeyWithModifier 函数
function getKeyWithModifier(key: string) {
  if (key === "Ctrl") return getPlatformSpecialKey();
  return modifier[key] || key;
}

// ShortcutItem 函数
const ShortcutItem = ({
  shortcut,
  recordingKey,
  onStartRecording,
}: {
  shortcut: KeyboardShortcut;
  recordingKey: string | null;
  onStartRecording: (keyId: string, shortcut: KeyboardShortcut) => void;
}) => {
  // Filter out lowercase duplicates for display - if both "j" and "J" exist, only show "J"
  const displayKeys = shortcut.keys.filter((key: string) => {
    if (
      key.includes("Cmd") &&
      shortcut.keys.includes(key.replace("Cmd", "Ctrl"))
    )
      return false;

    return true;
  });

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {shortcut.icon && (
          <div className="text-muted-foreground">{shortcut.icon}</div>
        )}
        <span className="text-sm">{shortcut.description}</span>
      </div>
      <div className="flex items-center gap-1">
        {displayKeys.map((key: string, index: number) => (
          <div key={index} className="flex items-center gap-1">
            <div className="flex items-center">
              {key.split("+").map((keyPart: string, partIndex: number) => {
// 常量定义 - 模块内部使用的固定值
                const keyId = `${shortcut.id}-${index}-${partIndex}`;
                return (
                  <EditableShortcutKey
                    key={partIndex}
                    keyId={keyId}
                    originalKey={key}
                    shortcut={shortcut}
                    isRecording={recordingKey === keyId}
                    onStartRecording={() => onStartRecording(keyId, shortcut)}
                  >
                    {getKeyWithModifier(keyPart)}
                  </EditableShortcutKey>
                );
              })}
            </div>
            {index < displayKeys.length - 1 && (
              <span className="text-xs text-muted-foreground">or</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// EditableShortcutKey 函数
const EditableShortcutKey = ({
  children,
  keyId,
  originalKey,
  shortcut,
  isRecording,
  onStartRecording,
}: {
  children: React.ReactNode;
  keyId: string;
  originalKey: string;
  shortcut: KeyboardShortcut;
  isRecording: boolean;
  onStartRecording: () => void;
}) => {
// handleClick 函数
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartRecording();
  };

  return (
    <kbd
      className={`inline-flex font-sans text-xs rounded px-2 min-w-[1.5rem] min-h-[1.5rem] leading-none items-center justify-center shadow-sm border mr-1 cursor-pointer hover:bg-opacity-80 ${
        isRecording
          ? "border-primary bg-primary/10"
          : "border-white/10 bg-black/20"
      }`}
      onClick={handleClick}
      title={
        isRecording ? "Press any key combination..." : "Click to edit shortcut"
      }
    >
      {children}
    </kbd>
  );
};

// KeyboardShortcutsHelp 函数
export const KeyboardShortcutsHelp = () => {
// 状态管理 - 创建和管理组件内部状态
  const [open, setOpen] = useState(false);
// 常量定义 - 模块内部使用的固定值
  const [recordingKey, setRecordingKey] = useState<string | null>(null);
// 常量定义 - 模块内部使用的固定值
  const [recordingShortcut, setRecordingShortcut] =
    useState<KeyboardShortcut | null>(null);

// 常量定义 - 模块内部使用的固定值
  const {
    updateKeybinding,
    removeKeybinding,
    getKeybindingString,
    validateKeybinding,
    getKeybindingsForAction,
  } = useKeybindingsStore();

  // Get shortcuts from centralized hook
  const { shortcuts } = useKeyboardShortcutsHelp();

// 常量定义 - 模块内部使用的固定值
  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
    if (!recordingKey || !recordingShortcut) return;

// handleKeyDown 函数
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

// 常量定义 - 模块内部使用的固定值
      const keyString = getKeybindingString(e);
      if (keyString) {
        // Auto-save the new keybinding
        const conflict = validateKeybinding(
          keyString,
          recordingShortcut.action
        );
        if (conflict) {
          toast.error(
            `Key "${keyString}" is already bound to "${conflict.existingAction}"`
          );
          setRecordingKey(null);
          setRecordingShortcut(null);
          return;
        }

        // Remove old keybindings for this action
        const oldKeys = getKeybindingsForAction(recordingShortcut.action);
        oldKeys.forEach((key) => removeKeybinding(key));

        // Add new keybinding
        updateKeybinding(keyString, recordingShortcut.action);

        setRecordingKey(null);
        setRecordingShortcut(null);
      }
    };

// handleClickOutside 函数
    const handleClickOutside = (e: MouseEvent) => {
      setRecordingKey(null);
      setRecordingShortcut(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [
    recordingKey,
    recordingShortcut,
    getKeybindingString,
    updateKeybinding,
    removeKeybinding,
    validateKeybinding,
    getKeybindingsForAction,
  ]);

// handleStartRecording 函数
  const handleStartRecording = (keyId: string, shortcut: KeyboardShortcut) => {
    setRecordingKey(keyId);
    setRecordingShortcut(shortcut);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="text" size="sm" className="gap-2">
          <Keyboard className="w-4 h-4" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your video editing workflow with these keyboard shortcuts.
            Click any shortcut key to edit it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category} className="flex flex-col gap-1">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {category}
              </h3>
              <div className="space-y-0.5">
                {shortcuts
                  .filter((shortcut) => shortcut.category === category)
                  .map((shortcut, index) => (
                    <ShortcutItem
                      key={index}
                      shortcut={shortcut}
                      recordingKey={recordingKey}
                      onStartRecording={handleStartRecording}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
