// performance-insights.tsx - 导出性能洞察组件
// 此组件显示导出性能分析和优化建议
// 文件路径: components/export/performance-insights.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  HardDrive,
  Wifi,
  Cpu,
  BarChart3,
  Lightbulb,
  Target
} from "lucide-react";
import { performanceAnalyzer, type PerformanceAnalysis } from "@/lib/export/performance-analyzer";
import { toast } from "sonner";

interface PerformanceInsightsProps {
  className?: string;
  onOptimizationApplied?: (optimization: string) => void;
}

export function PerformanceInsights({ className, onOptimizationApplied }: PerformanceInsightsProps) {
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedOptimization, setSelectedOptimization] = useState<string | null>(null);

  // 自动分析性能
  useEffect(() => {
    analyzePerformance();
  }, []);

  const analyzePerformance = async () => {
    setIsAnalyzing(true);
    try {
      // 模拟分析延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = performanceAnalyzer.analyzeExportPerformance();
      setAnalysis(result);
    } catch (error) {
      console.error('Performance analysis failed:', error);
      toast.error('性能分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <TrendingDown className="w-5 h-5 text-red-600" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getBottleneckIcon = (type: string) => {
    switch (type) {
      case 'network': return <Wifi className="w-4 h-4" />;
      case 'processing': return <Cpu className="w-4 h-4" />;
      case 'memory': return <HardDrive className="w-4 h-4" />;
      case 'complexity': return <BarChart3 className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const applyOptimization = (optimization: any) => {
    setSelectedOptimization(optimization.type);
    
    // 模拟应用优化
    setTimeout(() => {
      toast.success(`已应用优化: ${optimization.title}`, {
        description: `预计提速 ${optimization.estimatedSpeedup}x`
      });
      setSelectedOptimization(null);
      onOptimizationApplied?.(optimization.type);
      
      // 重新分析性能
      analyzePerformance();
    }, 1000);
  };

  if (isAnalyzing) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            性能分析中...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={75} className="w-full" />
            <p className="text-sm text-muted-foreground">正在分析导出性能和瓶颈...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>性能分析</CardTitle>
          <CardDescription>分析导出性能失败</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={analyzePerformance} variant="outline">
            重新分析
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          导出性能洞察
        </CardTitle>
        <CardDescription>
          基于当前项目状态的性能分析和优化建议
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 性能评分 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getScoreIcon(analysis.performanceScore)}
            <div>
              <h3 className="font-semibold">性能评分</h3>
              <p className="text-sm text-muted-foreground">
                {analysis.totalElements} 个元素，{Math.round(analysis.totalDuration)}秒
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(analysis.performanceScore)}`}>
              {analysis.performanceScore}/100
            </div>
            <div className="text-sm text-muted-foreground">
              优化潜力: {analysis.optimizationPotential}%
            </div>
          </div>
        </div>

        <Progress value={analysis.performanceScore} className="w-full" />

        {/* 推荐策略 */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4" />
            <h4 className="font-semibold">推荐策略</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">导出方法:</span>
              <Badge variant="outline">{analysis.recommendedStrategy.method}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">预计时间:</span>
              <span className="text-sm font-medium">
                {Math.round(analysis.recommendedStrategy.estimatedTime)}秒
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {analysis.recommendedStrategy.reason}
            </p>
          </div>
        </div>

        {/* 性能瓶颈 */}
        {analysis.bottlenecks.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              性能瓶颈
            </h4>
            <div className="space-y-2">
              {analysis.bottlenecks.slice(0, 3).map((bottleneck, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getBottleneckIcon(bottleneck.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{bottleneck.description}</span>
                      <Badge variant={getSeverityColor(bottleneck.severity)} size="sm">
                        {bottleneck.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{bottleneck.impact}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">+{bottleneck.estimatedDelay}秒</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* 优化建议 */}
        {analysis.optimizations.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              优化建议
            </h4>
            <div className="space-y-3">
              {analysis.optimizations
                .filter(opt => opt.priority === 'high')
                .slice(0, 2)
                .map((optimization, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-medium">{optimization.title}</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        {optimization.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {optimization.estimatedSpeedup}x
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>难度: {optimization.difficulty}</span>
                      <span>优先级: {optimization.priority}</span>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => applyOptimization(optimization)}
                      disabled={selectedOptimization === optimization.type}
                      className="ml-2"
                    >
                      {selectedOptimization === optimization.type ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                          应用中...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3 mr-1" />
                          应用优化
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 刷新按钮 */}
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={analyzePerformance} size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            重新分析
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
