"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  Clock, 
  Loader2, 
  Video, 
  Scissors, 
  FileText,
  Sparkles,
  Download
} from "lucide-react";
import { useAIEditingStore } from "@/stores/ai-editing-store";
import { Card, CardContent } from "../ui/card";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";

export function VisualEditingProgress() {
  const { 
    visualEditingState, 
    editingSteps, 
    executionProgress, 
    currentEditingStep,
    currentProcessingClip 
  } = useAIEditingStore();

  const [visibleSteps, setVisibleSteps] = useState<string[]>([]);

  // 逐步显示步骤，创建动画效果
  useEffect(() => {
    if (editingSteps.length === 0) {
      setVisibleSteps([]);
      return;
    }

    const timer = setTimeout(() => {
      const completedSteps = editingSteps
        .filter(step => step.status === 'completed')
        .map(step => step.id);
      
      const executingStep = editingSteps.find(step => step.status === 'executing');
      if (executingStep) {
        setVisibleSteps([...completedSteps, executingStep.id]);
      } else {
        setVisibleSteps(completedSteps);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [editingSteps]);

  if (visualEditingState === 'idle') {
    return null;
  }

  const getStepIcon = (stepId: string, status: string) => {
    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (status === 'executing') {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }

    // 根据步骤类型返回不同图标
    if (stepId === 'prepare') return <Sparkles className="w-5 h-5 text-gray-400" />;
    if (stepId === 'download') return <Download className="w-5 h-5 text-gray-400" />;
    if (stepId.startsWith('clip-')) return <Video className="w-5 h-5 text-gray-400" />;
    if (stepId === 'subtitles') return <FileText className="w-5 h-5 text-gray-400" />;
    if (stepId === 'complete') return <Scissors className="w-5 h-5 text-gray-400" />;
    
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'executing': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 z-50 w-96"
    >
      <Card className="shadow-lg border-2">
        <CardContent className="p-4">
          {/* 标题和进度 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <motion.div
                animate={visualEditingState === 'executing' ? {
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{
                  duration: 1.5,
                  repeat: visualEditingState === 'executing' ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                <Scissors className="w-5 h-5 text-primary" />
              </motion.div>
              <h3 className="font-semibold text-sm">AI一键剪辑</h3>
            </div>
            <div className="flex items-center gap-2">
              {/* 状态指示器 */}
              <div className={`w-2 h-2 rounded-full ${
                visualEditingState === 'executing' ? 'bg-orange-500 animate-pulse' :
                visualEditingState === 'completed' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <Badge variant="secondary" className="text-xs">
                {Math.round(executionProgress)}%
              </Badge>
            </div>
          </div>

          {/* 总体进度条 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">总体进度</span>
              <span className="text-xs text-muted-foreground">
                {executionProgress < 70 ? "可视化剪辑中" :
                 executionProgress < 90 ? "生成最终结果" : "应用到时间轴"}
              </span>
            </div>
            <Progress value={executionProgress} className="h-3" />
            {currentProcessingClip && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border border-primary border-t-transparent rounded-full"
                />
                {currentProcessingClip}
              </p>
            )}
          </div>

          {/* 阶段指示器 */}
          <div className="mb-4 flex items-center justify-between text-xs">
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${
              executionProgress < 70 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                executionProgress < 70 ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
              }`} />
              可视化剪辑
            </div>
            <div className="w-4 h-px bg-gray-300" />
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${
              executionProgress >= 70 && executionProgress < 90 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                executionProgress >= 70 && executionProgress < 90 ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'
              }`} />
              生成结果
            </div>
            <div className="w-4 h-px bg-gray-300" />
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${
              executionProgress >= 90 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                executionProgress >= 90 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              应用到时间轴
            </div>
          </div>

          {/* 步骤列表 */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {editingSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: visibleSteps.includes(step.id) ? 1 : 0.3,
                    x: 0,
                    scale: step.status === 'executing' ? 1.02 : 1
                  }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  className={`flex items-center gap-3 p-2 rounded-lg border transition-all duration-300 ${getStepColor(step.status)}`}
                >
                  <div className="flex-shrink-0">
                    {getStepIcon(step.id, step.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      step.status === 'executing' ? 'text-blue-700' : 
                      step.status === 'completed' ? 'text-green-700' : 
                      'text-gray-600'
                    }`}>
                      {step.description}
                    </p>
                    
                    {step.status === 'executing' && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="h-1 bg-blue-300 rounded-full mt-1"
                      />
                    )}
                  </div>

                  {step.clipIndex !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      #{step.clipIndex + 1}
                    </Badge>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* 完成状态 */}
          {visualEditingState === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center"
            >
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-green-700">
                🎉 剪辑完成！
              </p>
              <p className="text-xs text-green-600 mt-1">
                视频已自动剪辑并添加字幕到时间轴
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
