import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Clock, 
  CheckCircle, 
  Loader2,
  Sparkles 
} from 'lucide-react';

interface ProgressiveLoadingIndicatorProps {
  isVisible: boolean;
  currentItem: number;
  totalItems: number;
  currentItemName?: string;
  stage: 'loading' | 'adding' | 'completed';
  onComplete?: () => void;
}

export function ProgressiveLoadingIndicator({
  isVisible,
  currentItem,
  totalItems,
  currentItemName,
  stage,
  onComplete
}: ProgressiveLoadingIndicatorProps) {
  const progress = totalItems > 0 ? (currentItem / totalItems) * 100 : 0;

  const getStageInfo = () => {
    switch (stage) {
      case 'loading':
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin text-blue-500" />,
          title: '🚀 正在加载视频',
          description: '正在获取视频信息和生成缩略图...',
          color: 'border-blue-200 bg-blue-50/50'
        };
      case 'adding':
        return {
          icon: <Video className="w-5 h-5 text-green-500" />,
          title: '✨ 正在添加到时间轴',
          description: '逐个添加视频片段，创造流畅的视觉体验...',
          color: 'border-green-200 bg-green-50/50'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
          title: '🎉 加载完成',
          description: '所有视频片段已成功添加到时间轴！',
          color: 'border-emerald-200 bg-emerald-50/50'
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
          className="fixed top-4 right-4 z-50 w-96"
        >
          <Card className={`shadow-xl border-2 ${stageInfo.color} backdrop-blur-sm`}>
            <CardContent className="p-5">
              {/* 标题区域 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {stageInfo.icon}
                  <div>
                    <h3 className="font-semibold text-sm text-gray-800">
                      {stageInfo.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {stageInfo.description}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs font-mono">
                  {currentItem}/{totalItems}
                </Badge>
              </div>

              {/* 进度条 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">
                    进度
                  </span>
                  <span className="text-xs font-mono text-gray-600">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-2.5 bg-gray-200" 
                />
              </div>

              {/* 当前处理项目 */}
              {currentItemName && stage !== 'completed' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={currentItemName}
                  className="bg-white/70 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-purple-500" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        正在处理: {currentItemName}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          预计还需 {Math.max(1, Math.ceil((totalItems - currentItem) * 0.3))} 秒
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 完成状态 */}
              {stage === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-200 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      delay: 0.5,
                      type: "spring",
                      stiffness: 200 
                    }}
                  >
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  </motion.div>
                  <p className="text-sm font-semibold text-emerald-700">
                    视频加载完成！
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {totalItems} 个视频片段已添加到时间轴
                  </p>
                </motion.div>
              )}

              {/* 提示信息 */}
              <div className="mt-4 p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  💡 渐进式加载提供更好的视觉体验
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 简化版本的进度指示器
export function SimpleProgressIndicator({
  isVisible,
  progress,
  message
}: {
  isVisible: boolean;
  progress: number;
  message: string;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Card className="shadow-lg border bg-white/95 backdrop-blur-sm">
            <CardContent className="p-4 min-w-[300px]">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {message}
                  </p>
                  <Progress value={progress} className="h-2 mt-2" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(progress)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
