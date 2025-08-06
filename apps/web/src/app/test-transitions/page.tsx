// test-transitions/page.tsx - 转场界面测试页面
// 此文件包含 转场界面测试页面 的相关代码
// 文件路径: app/test-transitions/page.tsx
// 最后更新: 2025/7/23

"use client";

import { TransitionsView } from "@/components/editor/media-panel/views/transitions";

export default function TestTransitionsPage() {
  return (
    <div className="min-h-screen bg-background">
    <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">转场界面测试</h1>
          <p className="text-muted-foreground mt-2">
            测试新的转场界面设计，参考热门转场列表样式
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 转场面板 */}
          <div className="border rounded-lg bg-card">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">转场面板</h2>
            <p className="text-sm text-muted-foreground">
                包含热门转场、基础转场、高级转场分类
              </p>
                  </div>
            <div className="h-[600px]">
              <TransitionsView />
            </div>
      </div>

          {/* 功能说明 */}
          <div className="space-y-6">
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="text-lg font-semibold mb-3">新增功能</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  热门转场分类，包含叠化、闪黑、闪白
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  水平滚动布局，参考图片设计
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  预览图片支持，使用.webp文件
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  热门标识和时长显示
                </li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="text-lg font-semibold mb-3">转场类型</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
                  <h4 className="font-medium text-primary">热门转场</h4>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    <li>• 向左拉屏 (slide-left)</li>
                    <li>• 黑色快闪 (flash-black)</li>
                    <li>• 白色快闪 (flash-white)</li>
                    <li>• 叠化溶解 (dissolve)</li>
                  </ul>
            </div>
            <div>
                  <h4 className="font-medium text-primary">基础转场</h4>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    <li>• 淡入淡出 (fade)</li>
                    <li>• 滑动转场 (slide)</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="text-lg font-semibold mb-3">技术实现</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 更新了 TransitionType 类型定义</li>
                <li>• 添加了 flash 转场滤镜生成</li>
                <li>• 实现了水平滚动的卡片布局</li>
                <li>• 集成了预览图片支持</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 