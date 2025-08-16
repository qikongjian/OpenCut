"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { 
  Play, 
  Video, 
  Scissors, 
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useAIEditingStore } from "@/stores/ai-editing-store";
import { toast } from "sonner";

export function VisualEditingDemo() {
  const { 
    currentEditingPlan,
    isShowingOriginalVideo,
    visualEditingState,
    showOriginalVideoInTimeline,
    executeVisualEditingPlan,
    generateMockData,
    loadAIEditingData
  } = useAIEditingStore();

  const [demoStep, setDemoStep] = useState<'generate' | 'show-original' | 'execute' | 'completed'>('generate');

  const handleGenerateDemo = () => {
    // 生成演示数据
    const mockData = generateMockData('demo-project');
    loadAIEditingData(mockData);
    setDemoStep('show-original');
    toast.success("AI剪辑计划已生成！");
  };

  const handleShowOriginal = async () => {
    await showOriginalVideoInTimeline();
    setDemoStep('execute');
    toast.success("原始视频已显示在时间轴！");
  };

  const handleExecuteDemo = async () => {
    await executeVisualEditingPlan();
    setDemoStep('completed');
  };

  const resetDemo = () => {
    setDemoStep('generate');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          可视化AI剪辑演示
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 步骤指示器 */}
        <div className="flex items-center justify-between">
          {[
            { key: 'generate', label: '生成计划', icon: Sparkles },
            { key: 'show-original', label: '显示原视频', icon: Video },
            { key: 'execute', label: '执行剪辑', icon: Scissors },
            { key: 'completed', label: '完成', icon: CheckCircle }
          ].map((step, index) => {
            const Icon = step.icon;
            const isActive = demoStep === step.key;
            const isCompleted = ['generate', 'show-original', 'execute', 'completed'].indexOf(demoStep) > 
                              ['generate', 'show-original', 'execute', 'completed'].indexOf(step.key);
            
            return (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  isActive ? 'border-primary bg-primary text-white' :
                  isCompleted ? 'border-green-500 bg-green-500 text-white' :
                  'border-gray-300 bg-gray-100 text-gray-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`ml-2 text-sm ${
                  isActive ? 'text-primary font-medium' :
                  isCompleted ? 'text-green-600' :
                  'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {index < 3 && (
                  <ArrowRight className="w-4 h-4 text-gray-300 mx-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* 当前步骤内容 */}
        <div className="p-4 bg-gray-50 rounded-lg">
          {demoStep === 'generate' && (
            <div className="text-center">
              <h3 className="font-medium mb-2">第一步：生成AI剪辑计划</h3>
              <p className="text-sm text-gray-600 mb-4">
                AI将分析视频内容，生成专业的剪辑方案
              </p>
              <Button onClick={handleGenerateDemo} className="bg-primary">
                <Sparkles className="w-4 h-4 mr-2" />
                生成剪辑计划
              </Button>
            </div>
          )}

          {demoStep === 'show-original' && (
            <div className="text-center">
              <h3 className="font-medium mb-2">第二步：显示原始视频</h3>
              <p className="text-sm text-gray-600 mb-4">
                在时间轴中显示完整的原始视频，为剪辑做准备
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge variant="secondary">
                  {currentEditingPlan?.timeline_clips.length || 0} 个片段待剪辑
                </Badge>
              </div>
              <Button 
                onClick={handleShowOriginal} 
                disabled={isShowingOriginalVideo}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isShowingOriginalVideo ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    已显示原视频
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    显示原始视频
                  </>
                )}
              </Button>
            </div>
          )}

          {demoStep === 'execute' && (
            <div className="text-center">
              <h3 className="font-medium mb-2">第三步：执行可视化剪辑</h3>
              <p className="text-sm text-gray-600 mb-4">
                观看AI自动执行剪辑操作，实时看到每个步骤
              </p>
              <Button 
                onClick={handleExecuteDemo}
                disabled={visualEditingState === 'executing'}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {visualEditingState === 'executing' ? (
                  <>
                    <Play className="w-4 h-4 mr-2 animate-pulse" />
                    正在剪辑...
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4 mr-2" />
                    开始可视化剪辑
                  </>
                )}
              </Button>
            </div>
          )}

          {demoStep === 'completed' && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-medium mb-2">🎉 剪辑完成！</h3>
              <p className="text-sm text-gray-600 mb-4">
                AI已成功完成视频剪辑并添加字幕到时间轴
              </p>
              <Button onClick={resetDemo} variant="outline">
                重新演示
              </Button>
            </div>
          )}
        </div>

        {/* 功能说明 */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <h4 className="font-medium mb-1">💡 功能亮点：</h4>
          <ul className="space-y-1">
            <li>• 实时可视化剪辑过程，用户可以看到每个操作步骤</li>
            <li>• 智能分析视频内容，自动生成专业剪辑方案</li>
            <li>• 自动添加AI字幕，提升视频观看体验</li>
            <li>• 支持原始视频预览，方便对比剪辑效果</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
