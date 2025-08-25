# 🎨 OpenCut 设计系统 - 颜色规范

## 📋 概述

本文档定义了 OpenCut 视频编辑器的完整颜色系统，确保所有UI组件使用统一的颜色规范，提供专业且一致的用户体验。

## 🎯 设计原则

### 1. **一致性优先**
- 所有组件必须使用系统定义的颜色变量
- 禁止硬编码颜色值（如 `#ff0000`, `blue-500` 等）
- 确保明暗主题的完美适配

### 2. **语义化设计**
- 颜色具有明确的语义含义
- 功能相同的元素使用相同的颜色
- 状态变化通过颜色变化体现

### 3. **可访问性**
- 确保足够的对比度
- 支持色盲用户
- 明暗主题无缝切换

## 🎨 核心颜色系统

### **基础颜色**
```css
/* 背景和前景 */
--background: hsl(0, 0%, 100%);        /* 主背景色 */
--foreground: hsl(0 0% 11%);           /* 主文字色 */
--card: hsl(216, 8%, 86%);             /* 卡片背景 */
--card-foreground: hsl(0 0% 2%);       /* 卡片文字 */

/* 主色调 */
--primary: hsl(205, 84%, 47%);         /* 主品牌色 - 蓝色 */
--primary-foreground: hsl(0 0% 91%);   /* 主色调文字 */

/* 辅助色 */
--secondary: hsl(216, 13%, 92%);       /* 次要背景 */
--muted: hsl(0 0% 85.1%);              /* 静音/禁用状态 */
--accent: hsl(216, 13%, 92%);          /* 强调色 */

/* 状态色 */
--destructive: hsl(0, 83%, 50%);       /* 危险/删除 */
--border: hsl(0 0% 83%);               /* 边框色 */
```

### **图表和功能色**
```css
--chart-1: hsl(220 70% 50%);  /* 蓝色 - 主要功能 */
--chart-2: hsl(160 60% 45%);  /* 绿色 - 成功/完成 */
--chart-3: hsl(30 80% 55%);   /* 橙色 - 警告/处理中 */
--chart-4: hsl(280 65% 60%);  /* 紫色 - 特殊功能 */
--chart-5: hsl(340 75% 55%);  /* 粉色 - 强调/热门 */
```

## 🎬 视频编辑器专用颜色

### **轨道颜色**
```typescript
export const TRACK_COLORS = {
  media: {
    solid: "bg-primary",           // 视频轨道 - 主蓝色
    background: "bg-primary/10",
    border: "border-primary/30",
  },
  text: {
    solid: "bg-chart-2",           // 文字轨道 - 绿色
    background: "bg-chart-2/10",
    border: "border-chart-2/30",
  },
  audio: {
    solid: "bg-chart-4",           // 音频轨道 - 紫色
    background: "bg-chart-4/10",
    border: "border-chart-4/30",
  },
  transition: {
    solid: "bg-chart-3",           // 转场轨道 - 橙色
    background: "bg-chart-3/10",
    border: "border-chart-3/30",
  },
};
```

### **转场颜色**
```typescript
export const TRANSITION_COLORS = {
  fade: "border-primary bg-primary/10",           // 淡入淡出 - 主蓝色
  slide: "border-chart-2 bg-chart-2/10",         // 滑动 - 绿色
  zoom: "border-chart-3 bg-chart-3/10",          // 缩放 - 橙色
  wipe: "border-chart-5 bg-chart-5/10",          // 擦除 - 粉色
  dissolve: "border-chart-4 bg-chart-4/10",      // 溶解 - 紫色
  flash: "border-destructive bg-destructive/10", // 闪光 - 红色
};
```

## 🤖 AI功能颜色规范

### **AI面板主色调**
- **主图标背景**: `bg-primary` (系统主蓝色)
- **功能图标**: 使用图表色系区分不同功能
  - 智能剪辑: `text-primary` (主蓝色)
  - 字幕生成: `text-chart-4` (紫色)
  - 时间轴: `text-chart-2` (绿色)

### **状态指示**
- **成功状态**: `bg-primary/10 text-primary border-primary/20`
- **处理中**: `bg-chart-3/10 text-chart-3 border-chart-3/20`
- **错误状态**: `bg-destructive/10 text-destructive border-destructive/20`

## 📱 组件颜色使用指南

### **按钮组件**
```typescript
// ✅ 正确使用
<Button variant="primary">主要操作</Button>
<Button variant="secondary">次要操作</Button>
<Button variant="destructive">删除操作</Button>

// ❌ 错误使用
<Button className="bg-blue-500">不要硬编码颜色</Button>
```

### **卡片组件**
```typescript
// ✅ 正确使用
<Card className="bg-card border-border">
  <CardContent className="text-card-foreground">
    内容
  </CardContent>
</Card>
```

### **状态提示**
```typescript
// ✅ 成功状态
<div className="bg-primary/10 text-primary border border-primary/20">
  操作成功
</div>

// ✅ 警告状态  
<div className="bg-chart-3/10 text-chart-3 border border-chart-3/20">
  注意事项
</div>

// ✅ 错误状态
<div className="bg-destructive/10 text-destructive border border-destructive/20">
  错误信息
</div>
```

## 🌓 明暗主题适配

### **自动适配原则**
- 所有颜色变量在明暗主题下有对应定义
- 使用CSS变量确保主题切换的平滑过渡
- 透明度和渐变效果在两种主题下都保持良好视觉效果

### **主题特定调整**
```css
.dark {
  --background: hsl(0 0% 4%);
  --foreground: hsl(0 0% 89%);
  --card: hsl(0 0% 14.9%);
  --primary: hsl(205, 84%, 53%);
  /* ... 其他暗色主题变量 */
}
```

## ✅ 最佳实践

### **DO - 推荐做法**
1. 始终使用CSS变量: `bg-primary`, `text-foreground`
2. 使用透明度变体: `bg-primary/10`, `border-primary/30`
3. 保持语义化: 相同功能使用相同颜色
4. 测试明暗主题: 确保两种主题下都有良好效果

### **DON'T - 避免做法**
1. 硬编码颜色: `bg-blue-500`, `text-red-600`
2. 混用颜色系统: 不要在同一功能中使用不同的颜色变量
3. 忽略对比度: 确保文字和背景有足够对比度
4. 过度使用颜色: 保持界面的简洁和专业

## 🔧 开发工具

### **VSCode 扩展推荐**
- Tailwind CSS IntelliSense: 自动补全和预览
- Color Highlight: 颜色值高亮显示

### **检查工具**
- 使用浏览器开发者工具检查颜色对比度
- 定期进行色盲友好性测试
- 确保明暗主题切换的流畅性

---

**更新日期**: 2025-01-25  
**版本**: v1.0  
**维护者**: OpenCut 设计团队
