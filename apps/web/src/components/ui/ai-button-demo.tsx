// ai-button-demo.tsx - AI按钮演示组件
// 此文件展示AI渐变按钮的各种状态和用法
// 文件路径: components/ui/ai-button-demo.tsx

import React from "react";
import { Button } from "./button";
import { Bot, Zap, Sparkles, Wand2, Play, Download } from "lucide-react";

/**
 * AI按钮演示组件
 */
export function AIButtonDemo() {
  return (
    <div className="p-8 space-y-8 bg-background">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">AI Gradient Buttons</h2>
        <p className="text-muted-foreground">
          Beautiful gradient buttons for AI features with your custom color scheme
        </p>
      </div>

      {/* 主要AI按钮 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Primary AI Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="ai-gradient"
            size="default"
            style={{
              background: 'var(--ai-gradient)',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient)';
            }}
          >
            <Bot className="w-4 h-4 mr-2" />
            Generate AI Plan
          </Button>

          <Button
            variant="ai-gradient"
            size="default"
            style={{
              background: 'var(--ai-gradient)',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient)';
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            One-Click Edit
          </Button>

          <Button
            variant="ai-gradient"
            size="default"
            style={{
              background: 'var(--ai-gradient)',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient)';
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Magic
          </Button>
        </div>
      </div>

      {/* 小尺寸AI按钮 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Small AI Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="ai-gradient"
            size="sm"
            style={{
              background: 'var(--ai-gradient)',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient)';
            }}
          >
            <Wand2 className="w-3 h-3 mr-1" />
            Smart Cut
          </Button>

          <Button
            variant="ai-gradient"
            size="sm"
            style={{
              background: 'var(--ai-gradient)',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient)';
            }}
          >
            <Play className="w-3 h-3 mr-1" />
            Auto Play
          </Button>

          <Button
            variant="ai-gradient"
            size="sm"
            style={{
              background: 'var(--ai-gradient)',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient)';
            }}
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* 大尺寸AI按钮 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Large AI Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="ai-gradient"
            size="lg"
            style={{
              background: 'var(--ai-gradient)',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--ai-gradient)';
            }}
          >
            <Bot className="w-5 h-5 mr-3" />
            Start AI Editing Session
          </Button>
        </div>
      </div>

      {/* 禁用状态 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Disabled State</h3>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="ai-gradient"
            size="default"
            disabled
            style={{
              background: 'var(--ai-gradient-disabled)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Bot className="w-4 h-4 mr-2" />
            Processing...
          </Button>

          <Button
            variant="ai-gradient"
            size="sm"
            disabled
            style={{
              background: 'var(--ai-gradient-disabled)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="w-3 h-3 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Loading...
          </Button>
        </div>
      </div>

      {/* 渐变文字 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Gradient Text</h3>
        <div className="space-y-2">
          <h4 className="text-2xl font-bold ai-gradient-text">
            AI-Powered Video Editing
          </h4>
          <p className="text-lg ai-gradient-text">
            Experience the future of content creation
          </p>
        </div>
      </div>

      {/* 颜色说明 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Color Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border">
            <div 
              className="w-full h-12 rounded mb-2"
              style={{ background: '#6b57ffb3' }}
            ></div>
            <p className="text-sm font-medium">#6b57ffb3</p>
            <p className="text-xs text-muted-foreground">Purple Start</p>
          </div>
          
          <div className="p-4 rounded-lg border">
            <div 
              className="w-full h-12 rounded mb-2"
              style={{ background: '#3f62ffb3' }}
            ></div>
            <p className="text-sm font-medium">#3f62ffb3</p>
            <p className="text-xs text-muted-foreground">Blue Middle</p>
          </div>
          
          <div className="p-4 rounded-lg border">
            <div 
              className="w-full h-12 rounded mb-2"
              style={{ background: '#00cae0b3' }}
            ></div>
            <p className="text-sm font-medium">#00cae0b3</p>
            <p className="text-xs text-muted-foreground">Cyan End</p>
          </div>
        </div>
      </div>

      {/* 完整渐变预览 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Full Gradient Preview</h3>
        <div className="space-y-3">
          <div 
            className="w-full h-16 rounded-lg flex items-center justify-center text-white font-semibold"
            style={{ 
              background: 'linear-gradient(97deg, #6b57ffb3, #3f62ffb3 50%, #00cae0b3)',
              backdropFilter: 'blur(10px)'
            }}
          >
            Your Custom AI Gradient (97deg)
          </div>
          
          <div 
            className="w-full h-12 rounded-lg flex items-center justify-center text-white font-medium"
            style={{ 
              background: 'linear-gradient(97deg, #6b57ffd9, #3f62ffd9 50%, #00cae0d9)',
              backdropFilter: 'blur(10px)'
            }}
          >
            Hover State (Higher Opacity)
          </div>
          
          <div 
            className="w-full h-12 rounded-lg flex items-center justify-center text-white/70 font-medium"
            style={{ 
              background: 'linear-gradient(97deg, #6b57ff66, #3f62ff66 50%, #00cae066)',
              backdropFilter: 'blur(10px)'
            }}
          >
            Disabled State (Lower Opacity)
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIButtonDemo;
