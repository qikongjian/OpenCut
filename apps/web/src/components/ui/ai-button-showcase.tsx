// ai-button-showcase.tsx - AI按钮美化展示组件
// 此文件展示AI剪辑面板的新按钮样式
// 文件路径: components/ui/ai-button-showcase.tsx

import React from 'react';
import { Button } from './button';
import { Bot, Zap, Sparkles, Play, Download, Settings } from 'lucide-react';

/**
 * AI按钮美化展示组件
 */
export const AIButtonShowcase: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-background">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">AI剪辑面板按钮美化</h2>
        <p className="text-muted-foreground">
          使用渐变色 linear-gradient(97deg, #6b57ffb3, #3f62ffb3 50%, #00cae0b3) 的现代化按钮设计
        </p>
      </div>

      {/* 主要AI按钮 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">主要AI操作按钮</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 生成AI剪辑计划按钮 */}
          <Button
            variant="ai-gradient"
            size="default"
            className="w-full ai-gradient-bg ai-gradient-hover ai-gradient-disabled backdrop-blur-sm"
          >
            <Bot className="w-4 h-4 mr-2" />
            Generate AI Editing Plan
          </Button>

          {/* 一键剪辑按钮 */}
          <Button
            variant="ai-gradient"
            size="default"
            className="w-full ai-gradient-bg ai-gradient-hover ai-gradient-disabled backdrop-blur-sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            Start One-Click Edit
          </Button>

          {/* 智能优化按钮 */}
          <Button
            variant="ai-gradient"
            size="default"
            className="w-full ai-gradient-bg ai-gradient-hover ai-gradient-disabled backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Smart Optimization
          </Button>

          {/* 预览生成按钮 */}
          <Button
            variant="ai-gradient"
            size="default"
            className="w-full ai-gradient-bg ai-gradient-hover ai-gradient-disabled backdrop-blur-sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Generate Preview
          </Button>
        </div>
      </div>

      {/* 不同尺寸的AI按钮 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">不同尺寸展示</h3>
        <div className="flex flex-wrap items-center gap-4">
          
          {/* 小尺寸 */}
          <Button
            variant="ai-gradient"
            size="sm"
            className="ai-gradient-bg ai-gradient-hover ai-gradient-disabled backdrop-blur-sm"
          >
            <Bot className="w-3 h-3 mr-1" />
            Small
          </Button>

          {/* 默认尺寸 */}
          <Button
            variant="ai-gradient"
            size="default"
            className="ai-gradient-bg ai-gradient-hover ai-gradient-disabled backdrop-blur-sm"
          >
            <Bot className="w-4 h-4 mr-2" />
            Default
          </Button>

          {/* 大尺寸 */}
          <Button
            variant="ai-gradient"
            size="lg"
            className="ai-gradient-bg ai-gradient-hover ai-gradient-disabled backdrop-blur-sm"
          >
            <Bot className="w-5 h-5 mr-2" />
            Large
          </Button>

          {/* 图标按钮 */}
          <Button
            variant="ai-gradient"
            size="icon"
            className="ai-gradient-bg ai-gradient-hover ai-gradient-disabled backdrop-blur-sm"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 按钮状态展示 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">按钮状态展示</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 正常状态 */}
          <Button
            variant="ai-gradient"
            size="default"
            className="w-full ai-gradient-bg ai-gradient-hover ai-gradient-disabled backdrop-blur-sm"
          >
            <Bot className="w-4 h-4 mr-2" />
            Normal State
          </Button>

          {/* 加载状态 */}
          <Button
            variant="ai-gradient"
            size="default"
            disabled
            className="w-full ai-gradient-bg ai-gradient-hover ai-gradient-disabled backdrop-blur-sm"
          >
            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Loading...
          </Button>

          {/* 禁用状态 */}
          <Button
            variant="ai-gradient"
            size="default"
            disabled
            className="w-full ai-gradient-bg ai-gradient-hover ai-gradient-disabled backdrop-blur-sm"
          >
            <Bot className="w-4 h-4 mr-2" />
            Disabled
          </Button>
        </div>
      </div>

      {/* 渐变色信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">渐变色信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 正常渐变 */}
          <div className="p-4 rounded-lg border border-border">
            <div 
              className="w-full h-12 rounded-md mb-2"
              style={{ background: 'linear-gradient(97deg, #6b57ffb3, #3f62ffb3 50%, #00cae0b3)' }}
            />
            <p className="text-sm font-medium">Normal Gradient</p>
            <p className="text-xs text-muted-foreground">
              #6b57ffb3 → #3f62ffb3 → #00cae0b3
            </p>
          </div>

          {/* 悬停渐变 */}
          <div className="p-4 rounded-lg border border-border">
            <div 
              className="w-full h-12 rounded-md mb-2"
              style={{ background: 'linear-gradient(97deg, #6b57ffd9, #3f62ffd9 50%, #00cae0d9)' }}
            />
            <p className="text-sm font-medium">Hover Gradient</p>
            <p className="text-xs text-muted-foreground">
              #6b57ffd9 → #3f62ffd9 → #00cae0d9
            </p>
          </div>

          {/* 禁用渐变 */}
          <div className="p-4 rounded-lg border border-border">
            <div 
              className="w-full h-12 rounded-md mb-2"
              style={{ background: 'linear-gradient(97deg, #6b57ff66, #3f62ff66 50%, #00cae066)' }}
            />
            <p className="text-sm font-medium">Disabled Gradient</p>
            <p className="text-xs text-muted-foreground">
              #6b57ff66 → #3f62ff66 → #00cae066
            </p>
          </div>
        </div>
      </div>

      {/* 设计特点 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">设计特点</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
            <h4 className="font-medium mb-2">🎨 现代渐变</h4>
            <p className="text-sm text-muted-foreground">
              97度角的紫→蓝→青渐变，营造科技感和未来感
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
            <h4 className="font-medium mb-2">✨ 毛玻璃效果</h4>
            <p className="text-sm text-muted-foreground">
              backdrop-blur-sm 创造现代化的毛玻璃质感
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
            <h4 className="font-medium mb-2">🎯 交互反馈</h4>
            <p className="text-sm text-muted-foreground">
              悬停时渐变加深，点击时轻微缩放，提供丰富的交互反馈
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
            <h4 className="font-medium mb-2">🌓 主题适配</h4>
            <p className="text-sm text-muted-foreground">
              自动适配明暗主题，在不同模式下都有最佳视觉效果
            </p>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">使用说明</h3>
        <div className="p-4 rounded-lg bg-muted/20 border border-border/40">
          <pre className="text-sm text-muted-foreground overflow-x-auto">
{`<Button
  variant="ai-gradient"
  size="default"
  className="ai-gradient-bg ai-gradient-hover ai-gradient-disabled backdrop-blur-sm"
>
  <Bot className="w-4 h-4 mr-2" />
  Generate AI Editing Plan
</Button>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AIButtonShowcase;
