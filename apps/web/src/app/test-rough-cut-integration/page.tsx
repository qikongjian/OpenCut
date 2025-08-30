"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Play } from 'lucide-react';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  duration?: number;
}

export default function TestRoughCutIntegrationPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<{ success: boolean; total: number; passed: number } | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);

    try {
      // 动态导入测试函数
      const { testRoughCutIntegration } = await import('@/lib/test-rough-cut-integration');
      
      const testResult = await testRoughCutIntegration();
      
      setResults(testResult.results);
      setSummary({
        success: testResult.success,
        total: testResult.results.length,
        passed: testResult.results.filter(r => r.success).length
      });
      
    } catch (error) {
      console.error('测试执行失败:', error);
      setResults([{
        test: '测试执行',
        success: false,
        message: `测试执行失败: ${error instanceof Error ? error.message : String(error)}`
      }]);
      setSummary({ success: false, total: 1, passed: 0 });
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickTest = async () => {
    try {
      const { quickTest } = await import('@/lib/test-rough-cut-integration');
      const result = quickTest();
      
      setResults([{
        test: '快速检查',
        success: result.configured && !result.projectId.startsWith('temp-'),
        message: `${result.message}\n项目ID: ${result.projectId}\n服务配置: ${result.configured ? '已配置' : '未配置'}`
      }]);
      
      setSummary({
        success: result.configured && !result.projectId.startsWith('temp-'),
        total: 1,
        passed: result.configured && !result.projectId.startsWith('temp-') ? 1 : 0
      });
      
    } catch (error) {
      console.error('快速测试失败:', error);
      setResults([{
        test: '快速检查',
        success: false,
        message: `快速测试失败: ${error instanceof Error ? error.message : String(error)}`
      }]);
      setSummary({ success: false, total: 1, passed: 0 });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">粗剪视频接口集成测试</h1>
        <p className="text-muted-foreground">
          测试导出接口与粗剪视频接口的集成功能
        </p>
      </div>

      <div className="flex gap-4 justify-center">
        <Button 
          onClick={runQuickTest}
          disabled={isRunning}
          variant="outline"
        >
          <Play className="w-4 h-4 mr-2" />
          快速测试
        </Button>
        
        <Button 
          onClick={runTests}
          disabled={isRunning}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Play className="w-4 h-4 mr-2" />
          {isRunning ? '测试中...' : '完整测试'}
        </Button>
      </div>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {summary.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              测试结果总览
            </CardTitle>
            <CardDescription>
              {summary.passed}/{summary.total} 项测试通过
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={summary.success ? "default" : "destructive"}>
                {summary.success ? "全部通过" : "部分失败"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                成功率: {((summary.passed / summary.total) * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">测试详情</h2>
          
          {results.map((result, index) => (
            <Card key={index} className={result.success ? "border-green-200" : "border-red-200"}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    {result.test}
                  </div>
                  
                  {result.duration && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {result.duration}ms
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                  {result.message}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isRunning && results.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              点击上方按钮开始测试粗剪视频接口集成功能
            </p>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>快速测试:</strong> 检查配置和项目ID获取</p>
              <p><strong>完整测试:</strong> 包含健康检查和模拟接口调用</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-2">
          <p>1. <strong>环境配置:</strong> 确保设置了 ROUGH_CUT_API_URL 环境变量</p>
          <p>2. <strong>项目ID:</strong> 在编辑器页面中测试可获得真实项目ID</p>
          <p>3. <strong>网络连接:</strong> 完整测试需要网络连接到粗剪服务</p>
          <p>4. <strong>控制台:</strong> 详细日志会输出到浏览器控制台</p>
        </CardContent>
      </Card>
    </div>
  );
}
