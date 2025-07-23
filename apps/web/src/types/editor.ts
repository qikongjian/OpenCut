// editor.ts - TypeScript 类型定义
// 此文件包含 typescript 类型定义 的相关代码
// 文件路径: types/editor.ts
// 最后更新: 2025/7/23

// editor.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 编辑器相关的类型定义

// 画布尺寸接口
export interface CanvasSize {
  width: number; // 画布宽度（像素）
  height: number; // 画布高度（像素）
}

// 画布预设接口
export interface CanvasPreset {
  name: string; // 预设名称（如 "16:9", "9:16"）
  width: number; // 预设宽度（像素）
  height: number; // 预设高度（像素）
}

// 编辑器实例接口 - 用于插件系统
export interface EditorInstance {
  // 编辑器核心功能
  canvas: {
    size: CanvasSize; // 当前画布尺寸
    setSize: (size: CanvasSize) => void; // 设置画布尺寸
  };
  
  // 时间线功能
  timeline: {
    tracks: any[]; // 轨道列表
    addTrack: (track: any) => void; // 添加轨道
    removeTrack: (trackId: string) => void; // 删除轨道
  };
  
  // 媒体管理功能
  media: {
    items: any[]; // 媒体项列表
    addItem: (item: any) => void; // 添加媒体项
    removeItem: (itemId: string) => void; // 删除媒体项
  };
  
  // 播放控制功能
  playback: {
    currentTime: number; // 当前播放时间
    duration: number; // 总时长
    isPlaying: boolean; // 是否正在播放
    play: () => void; // 播放
    pause: () => void; // 暂停
    seek: (time: number) => void; // 跳转到指定时间
  };
  
  // 项目功能
  project: {
    save: () => Promise<void>; // 保存项目
    load: (projectId: string) => Promise<void>; // 加载项目
    export: (format: string) => Promise<void>; // 导出项目
  };
}

// 编辑器配置接口
export interface EditorConfig {
  // 基础配置
  canvasSize: CanvasSize; // 默认画布尺寸
  canvasPresets: CanvasPreset[]; // 可用画布预设
  
  // 功能开关
  features: {
    textEditing: boolean; // 文本编辑功能
    audioEditing: boolean; // 音频编辑功能
    videoEffects: boolean; // 视频特效功能
    transitions: boolean; // 转场效果功能
    export: boolean; // 导出功能
  };
  
  // 性能配置
  performance: {
    maxTracks: number; // 最大轨道数
    maxElementsPerTrack: number; // 每轨道最大元素数
    previewQuality: "low" | "medium" | "high"; // 预览质量
  };
  
  // 用户界面配置
  ui: {
    theme: "light" | "dark" | "auto"; // 主题
    language: string; // 语言
    showGrid: boolean; // 显示网格
    showRulers: boolean; // 显示标尺
  };
}

// 编辑器状态接口
export interface EditorState {
  // 加载状态
  isInitializing: boolean; // 是否正在初始化
  isReady: boolean; // 是否准备就绪
  isLoading: boolean; // 是否正在加载
  
  // 当前项目
  currentProject: {
    id: string | null; // 项目ID
    name: string; // 项目名称
    isModified: boolean; // 是否已修改
    lastSaved: Date | null; // 最后保存时间
  };
  
  // 编辑器模式
  mode: "edit" | "preview" | "export"; // 当前模式
  
  // 选择状态
  selection: {
    elements: string[]; // 选中的元素ID列表
    tracks: string[]; // 选中的轨道ID列表
  };
  
  // 视图状态
  view: {
    zoom: number; // 缩放级别
    pan: { x: number; y: number }; // 平移位置
    showTimeline: boolean; // 显示时间线
    showProperties: boolean; // 显示属性面板
  };
}

// 编辑器事件类型
export type EditorEvent = 
  | "project:created" // 项目创建
  | "project:loaded" // 项目加载
  | "project:saved" // 项目保存
  | "project:modified" // 项目修改
  | "element:added" // 元素添加
  | "element:removed" // 元素删除
  | "element:modified" // 元素修改
  | "playback:started" // 播放开始
  | "playback:stopped" // 播放停止
  | "export:started" // 导出开始
  | "export:completed" // 导出完成
  | "export:failed"; // 导出失败

// 编辑器事件处理器接口
export interface EditorEventHandler {
  (event: EditorEvent, data?: any): void; // 事件处理函数
}

// 编辑器插件接口
export interface EditorPlugin {
  id: string; // 插件唯一标识符
  name: string; // 插件名称
  version: string; // 插件版本
  description?: string; // 插件描述
  
  // 生命周期方法
  onLoad?: (editor: EditorInstance) => void; // 插件加载时调用
  onUnload?: () => void; // 插件卸载时调用
  
  // 功能扩展
  effects?: any[]; // 特效列表
  transitions?: any[]; // 转场效果列表
  filters?: any[]; // 滤镜列表
  
  // UI 扩展
  panels?: any[]; // 面板列表
  tools?: any[]; // 工具列表
  menuItems?: any[]; // 菜单项列表
}
