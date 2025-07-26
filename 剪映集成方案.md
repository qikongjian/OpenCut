# 剪映完整功能集成方案

## 概述

为了快速在 OpenCut 项目中集成完整版的剪映功能，避免从零开发的时间成本，我们提供以下几种集成方案。每种方案都有其优缺点，可以根据具体需求选择最适合的方案。

## 方案一：iframe 嵌入剪映 Web 版（推荐）

### 技术原理
通过 iframe 标签直接嵌入剪映的 Web 版本，实现完整功能的快速集成。

### 实现步骤

#### 1. 创建 iframe 组件
```typescript
// apps/web/src/components/editor/capcut-iframe.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink, Maximize2, Minimize2 } from "lucide-react";

interface CapCutIframeProps {
  className?: string;
  onClose?: () => void;
}

export function CapCutIframe({ className, onClose }: CapCutIframeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 剪映 Web 版 URL
  const capcutUrl = "https://www.capcut.com/web";

  useEffect(() => {
    const handleLoad = () => {
      setIsLoading(false);
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleLoad);
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      iframeRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const openInNewTab = () => {
    window.open(capcutUrl, '_blank');
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <img src="/logo.svg" alt="CapCut" className="w-6 h-6" />
              剪映编辑器
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                title={isFullscreen ? "退出全屏" : "全屏"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
                title="在新标签页中打开"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  关闭
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>正在加载剪映编辑器...</span>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={capcutUrl}
            className="w-full h-full border-0"
            allow="camera; microphone; geolocation; encrypted-media"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="剪映编辑器"
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 2. 修改编辑器页面
```typescript
// apps/web/src/app/editor/[project_id]/page.tsx
// 在现有代码基础上添加剪映集成

import { CapCutIframe } from "@/components/editor/capcut-iframe";
import { useState } from "react";

export default function Editor() {
  const [showCapCut, setShowCapCut] = useState(false);
  
  // ... 现有代码 ...

  return (
    <EditorProvider>
      <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
        <EditorHeader />
        
        {/* 添加剪映切换按钮 */}
        <div className="flex items-center gap-2 px-4 py-2 border-b">
          <Button
            variant={showCapCut ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCapCut(!showCapCut)}
          >
            {showCapCut ? "返回 OpenCut" : "使用剪映"}
          </Button>
        </div>

        <div className="flex-1 min-h-0 min-w-0">
          {showCapCut ? (
            <CapCutIframe onClose={() => setShowCapCut(false)} />
          ) : (
            <ResizablePanelGroup direction="vertical" className="h-full w-full gap-[0.18rem]">
              {/* 现有的编辑器布局 */}
              {/* ... 现有代码 ... */}
            </ResizablePanelGroup>
          )}
        </div>
        <Onboarding />
      </div>
    </EditorProvider>
  );
}
```

### 优点
- ✅ **快速集成**：几乎零开发时间
- ✅ **功能完整**：获得剪映的所有功能
- ✅ **稳定可靠**：使用官方维护的版本
- ✅ **无需维护**：功能更新自动跟随官方

### 缺点
- ❌ **依赖外部**：需要剪映 Web 版可用
- ❌ **跨域限制**：可能遇到 CSP 策略限制
- ❌ **数据隔离**：无法直接访问剪映内部数据
- ❌ **品牌混同**：用户可能混淆产品边界

### 适用场景
- 快速原型验证
- 功能演示
- 临时解决方案
- 用户需求调研

## 方案二：剪映 SDK 集成

### 技术原理
使用剪映官方提供的 SDK 或 API，在本地环境中集成剪映的核心功能。

### 实现步骤

#### 1. 安装剪映 SDK
```bash
# 需要联系剪映官方获取 SDK
npm install @capcut/sdk
# 或
yarn add @capcut/sdk
```

#### 2. 创建剪映 SDK 组件
```typescript
// apps/web/src/components/editor/capcut-sdk.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CapCutSDKProps {
  className?: string;
  onClose?: () => void;
}

export function CapCutSDK({ className, onClose }: CapCutSDKProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initCapCutSDK = async () => {
      try {
        // 初始化剪映 SDK
        const { CapCutEditor } = await import('@capcut/sdk');
        
        const editor = new CapCutEditor({
          container: containerRef.current,
          apiKey: process.env.NEXT_PUBLIC_CAPCUT_API_KEY,
          config: {
            theme: 'light',
            language: 'zh-CN',
            features: {
              timeline: true,
              effects: true,
              transitions: true,
              audio: true,
              text: true,
              stickers: true,
              filters: true,
            }
          }
        });

        await editor.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : '初始化失败');
      }
    };

    initCapCutSDK();
  }, []);

  return (
    <div className={`w-full h-full ${className}`}>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>剪映编辑器 (SDK)</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 relative">
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <p className="text-red-500 mb-2">初始化失败</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          )}
          {!isInitialized && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <p>正在初始化剪映编辑器...</p>
              </div>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full" />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 优点
- ✅ **深度集成**：可以完全控制界面和功能
- ✅ **数据互通**：可以与 OpenCut 数据系统集成
- ✅ **品牌统一**：保持 OpenCut 的品牌一致性
- ✅ **功能定制**：可以根据需求定制功能

### 缺点
- ❌ **需要授权**：需要剪映官方授权和 API Key
- ❌ **开发成本**：需要额外的开发工作
- ❌ **维护成本**：需要维护 SDK 集成代码
- ❌ **功能限制**：可能受 SDK 功能限制

### 适用场景
- 长期产品规划
- 深度功能集成
- 品牌统一要求
- 数据互通需求

## 方案三：开源视频编辑器集成

### 技术原理
集成成熟的开源视频编辑器，如 Video.js Editor、FFmpeg.js 等，快速获得专业级编辑功能。

### 推荐开源方案

#### 3.1 Video.js Editor
```bash
npm install video.js @videojs/themes
```

#### 3.2 FFmpeg.js 增强
基于现有的 FFmpeg 集成，扩展更多编辑功能：

```typescript
// apps/web/src/lib/ffmpeg-enhanced.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export class EnhancedVideoEditor {
  private ffmpeg: FFmpeg | null = null;

  async initialize() {
    if (this.ffmpeg) return this.ffmpeg;
    
    this.ffmpeg = new FFmpeg();
    await this.ffmpeg.load({
      coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
    });
    
    return this.ffmpeg;
  }

  // 视频滤镜
  async applyFilter(videoFile: File, filter: string): Promise<Blob> {
    const ffmpeg = await this.initialize();
    const inputName = 'input.mp4';
    const outputName = 'output.mp4';
    
    await ffmpeg.writeFile(inputName, new Uint8Array(await videoFile.arrayBuffer()));
    
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', filter,
      outputName
    ]);
    
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: 'video/mp4' });
    
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    
    return blob;
  }

  // 视频转场效果
  async addTransition(video1: File, video2: File, transition: string): Promise<Blob> {
    const ffmpeg = await this.initialize();
    const input1Name = 'input1.mp4';
    const input2Name = 'input2.mp4';
    const outputName = 'output.mp4';
    
    await ffmpeg.writeFile(input1Name, new Uint8Array(await video1.arrayBuffer()));
    await ffmpeg.writeFile(input2Name, new Uint8Array(await video2.arrayBuffer()));
    
    // 根据转场类型执行不同的命令
    switch (transition) {
      case 'fade':
        await ffmpeg.exec([
          '-i', input1Name,
          '-i', input2Name,
          '-filter_complex', '[0:v][1:v]xfade=transition=fade:duration=1:offset=5[v]',
          '-map', '[v]',
          outputName
        ]);
        break;
      case 'slide':
        await ffmpeg.exec([
          '-i', input1Name,
          '-i', input2Name,
          '-filter_complex', '[0:v][1:v]xfade=transition=slideleft:duration=1:offset=5[v]',
          '-map', '[v]',
          outputName
        ]);
        break;
      default:
        throw new Error(`Unsupported transition: ${transition}`);
    }
    
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: 'video/mp4' });
    
    await ffmpeg.deleteFile(input1Name);
    await ffmpeg.deleteFile(input2Name);
    await ffmpeg.deleteFile(outputName);
    
    return blob;
  }

  // 音频处理
  async processAudio(videoFile: File, audioFilter: string): Promise<Blob> {
    const ffmpeg = await this.initialize();
    const inputName = 'input.mp4';
    const outputName = 'output.mp4';
    
    await ffmpeg.writeFile(inputName, new Uint8Array(await videoFile.arrayBuffer()));
    
    await ffmpeg.exec([
      '-i', inputName,
      '-af', audioFilter,
      '-c:v', 'copy',
      outputName
    ]);
    
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: 'video/mp4' });
    
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    
    return blob;
  }
}
```

### 优点
- ✅ **完全控制**：完全自主可控
- ✅ **无依赖**：不依赖第三方服务
- ✅ **可定制**：可以根据需求深度定制
- ✅ **开源免费**：无需支付授权费用

### 缺点
- ❌ **开发成本高**：需要大量开发工作
- ❌ **功能有限**：相比专业软件功能有限
- ❌ **维护复杂**：需要维护复杂的视频处理逻辑
- ❌ **性能挑战**：浏览器端处理大文件性能有限

### 适用场景
- 长期技术积累
- 完全自主可控需求
- 特定功能定制
- 成本敏感项目

## 方案四：混合集成方案（推荐）

### 技术原理
结合多种方案的优势，根据用户需求动态选择最适合的编辑方式。

### 实现架构

```typescript
// apps/web/src/components/editor/hybrid-editor.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CapCutIframe } from "./capcut-iframe";
import { CapCutSDK } from "./capcut-sdk";
import { OpenCutEditor } from "./opencut-editor";

type EditorMode = 'opencut' | 'capcut-iframe' | 'capcut-sdk';

interface HybridEditorProps {
  className?: string;
}

export function HybridEditor({ className }: HybridEditorProps) {
  const [currentMode, setCurrentMode] = useState<EditorMode>('opencut');
  const [isCapCutAvailable, setIsCapCutAvailable] = useState(false);

  useEffect(() => {
    // 检测剪映服务可用性
    const checkCapCutAvailability = async () => {
      try {
        const response = await fetch('https://www.capcut.com/web', {
          method: 'HEAD',
          mode: 'no-cors'
        });
        setIsCapCutAvailable(true);
      } catch (error) {
        setIsCapCutAvailable(false);
      }
    };

    checkCapCutAvailability();
  }, []);

  return (
    <div className={`w-full h-full ${className}`}>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <Tabs value={currentMode} onValueChange={(value) => setCurrentMode(value as EditorMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="opencut">OpenCut 编辑器</TabsTrigger>
              <TabsTrigger value="capcut-iframe" disabled={!isCapCutAvailable}>
                剪映 Web 版
              </TabsTrigger>
              <TabsTrigger value="capcut-sdk">剪映 SDK</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <TabsContent value="opencut" className="h-full m-0">
            <OpenCutEditor />
          </TabsContent>
          <TabsContent value="capcut-iframe" className="h-full m-0">
            <CapCutIframe />
          </TabsContent>
          <TabsContent value="capcut-sdk" className="h-full m-0">
            <CapCutSDK />
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 优点
- ✅ **灵活选择**：用户可以根据需求选择编辑方式
- ✅ **降级方案**：提供多种备选方案
- ✅ **渐进增强**：从基础功能逐步增强
- ✅ **最佳体验**：为不同用户提供最适合的体验

### 缺点
- ❌ **复杂度高**：需要管理多种编辑模式
- ❌ **状态同步**：不同模式间的数据同步复杂
- ❌ **维护成本**：需要维护多种集成方案

## 推荐实施方案

### 阶段一：快速集成（1-2周）
1. 实现方案一的 iframe 集成
2. 添加基本的切换功能
3. 处理跨域和安全问题

### 阶段二：功能增强（2-4周）
1. 实现方案四的混合集成
2. 添加数据同步功能
3. 优化用户体验

### 阶段三：深度集成（4-8周）
1. 评估剪映 SDK 可行性
2. 实现深度数据集成
3. 完善功能定制

## 技术注意事项

### 1. 跨域问题处理
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/capcut/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};
```

### 2. 安全策略配置
```typescript
// 在 iframe 组件中添加安全策略
<iframe
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
  referrerPolicy="no-referrer"
  loading="lazy"
/>
```

### 3. 性能优化
```typescript
// 懒加载剪映组件
const CapCutIframe = lazy(() => import('./capcut-iframe'));

// 使用 Suspense 包装
<Suspense fallback={<div>加载中...</div>}>
  <CapCutIframe />
</Suspense>
```

## 总结

推荐采用**方案四（混合集成方案）**作为主要实施方案，原因如下：

1. **快速上线**：可以快速集成剪映功能
2. **灵活性强**：支持多种编辑模式
3. **风险可控**：提供降级方案
4. **用户友好**：让用户选择最适合的编辑方式

通过分阶段实施，可以在保证快速交付的同时，逐步完善功能和用户体验。 