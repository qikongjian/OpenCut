// test-export/page.tsx - 导出功能测试页面
// 此页面用于测试完整的导出系统功能
// 文件路径: app/test-export/page.tsx

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download,
  Settings,
  Info
} from 'lucide-react';
import { 
  exportManager, 
  initializeExportSystem, 
  checkExportSystemHealth,
  exportSystemConfig 
} from '@/lib/export';

/**
 * 导出功能测试页面
 */
export default function TestExportPage() {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportProgress, setExportProgress] = React.useState(0);
  const [exportMessage, setExportMessage] = React.useState('');
  const [exportResult, setExportResult] = React.useState<any>(null);
  const [systemHealth, setSystemHealth] = React.useState<any>(null);
  const [capabilities, setCapabilities] = React.useState<any>(null);

  /**
   * 初始化导出系统
   */
  const handleInitialize = async () => {
    try {
      setExportMessage('正在初始化导出系统...');
      await initializeExportSystem();
      setIsInitialized(true);
      setExportMessage('导出系统初始化成功！');
      
      // 检查系统健康状态
      const health = await checkExportSystemHealth();
      setSystemHealth(health);
      
      // 检查导出能力
      const caps = await exportManager.checkCapabilities();
      setCapabilities(caps);
      
    } catch (error) {
      setExportMessage(`初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 测试智能导出
   */
  const handleTestSmartExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportMessage('开始智能导出测试...');

    try {
      const result = await exportManager.smartExport(
        {
          privacy: 'balanced',
          quality: 'standard',
          allowCloudProcessing: true,
        },
        (progress) => {
          setExportProgress(progress.overall);
          setExportMessage(progress.message || '处理中...');
        }
      );

      setExportResult(result);
      setExportMessage('导出测试完成！');
      setExportProgress(1);

    } catch (error) {
      setExportMessage(`导出测试失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * 测试前端导出
   */
  const handleTestFrontendExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportMessage('开始前端导出测试...');

    try {
      const result = await exportManager.manualExport(
        {
          quality: 'preview',
          method: 'frontend',
          format: 'mp4',
          codec: 'h264',
          subtitleMode: 'hard',
        },
        (progress) => {
          setExportProgress(progress.overall);
          setExportMessage(progress.message || '处理中...');
        }
      );

      setExportResult(result);
      setExportMessage('前端导出测试完成！');
      setExportProgress(1);

    } catch (error) {
      setExportMessage(`前端导出测试失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * 测试后端导出
   */
  const handleTestBackendExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportMessage('开始后端导出测试...');

    try {
      const result = await exportManager.manualExport(
        {
          quality: 'standard',
          method: 'backend',
          format: 'mp4',
          codec: 'h264',
          subtitleMode: 'hard',
        },
        (progress) => {
          setExportProgress(progress.overall);
          setExportMessage(progress.message || '处理中...');
        }
      );

      setExportResult(result);
      setExportMessage('后端导出测试完成！');
      setExportProgress(1);

    } catch (error) {
      setExportMessage(`后端导出测试失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * 获取导出策略建议
   */
  const handleGetStrategy = async () => {
    try {
      setExportMessage('正在分析导出策略...');
      
      const strategy = await exportManager.getExportStrategy({
        privacy: 'balanced',
        quality: 'standard',
        allowCloudProcessing: true,
      });

      setExportResult({ type: 'strategy', data: strategy });
      setExportMessage('策略分析完成！');
      
    } catch (error) {
      setExportMessage(`策略分析失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 预览导出设置
   */
  const handlePreviewExport = async () => {
    try {
      setExportMessage('正在预览导出设置...');
      
      const preview = await exportManager.previewExport({
        privacy: 'balanced',
        quality: 'standard',
        allowCloudProcessing: true,
      });

      setExportResult({ type: 'preview', data: preview });
      setExportMessage('预览完成！');
      
    } catch (error) {
      setExportMessage(`预览失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">导出功能测试页面</h1>
        <p className="text-gray-600">测试OpenCut导出系统的各项功能</p>
      </div>

      {/* 系统状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            系统状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={isInitialized ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {isInitialized ? '✅ 已初始化' : '❌ 未初始化'}
            </Badge>
            {systemHealth && (
              <Badge className={
                systemHealth.overall === 'healthy' ? 'bg-green-100 text-green-800' :
                systemHealth.overall === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }>
                {systemHealth.overall === 'healthy' ? '🟢 健康' :
                 systemHealth.overall === 'degraded' ? '🟡 降级' :
                 '🔴 异常'}
              </Badge>
            )}
          </div>
          
          {systemHealth && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <strong>前端:</strong> {systemHealth.components.frontend}
              </div>
              <div>
                <strong>后端:</strong> {systemHealth.components.backend}
              </div>
              <div>
                <strong>设备:</strong> {systemHealth.components.device}
              </div>
            </div>
          )}

          {capabilities && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>前端能力:</strong>
                <div className="ml-2">
                  <div>可用: {capabilities.frontend.available ? '✅' : '❌'}</div>
                  <div>特性: {capabilities.frontend.features.join(', ') || '无'}</div>
                  <div>限制: {capabilities.frontend.limitations.join(', ') || '无'}</div>
                </div>
              </div>
              <div>
                <strong>后端能力:</strong>
                <div className="ml-2">
                  <div>可用: {capabilities.backend.available ? '✅' : '❌'}</div>
                  <div>特性: {capabilities.backend.features.join(', ') || '无'}</div>
                  <div>限制: {capabilities.backend.limitations.join(', ') || '无'}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            操作控制
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleInitialize}
              disabled={isInitialized}
              className="w-full"
            >
              {isInitialized ? '✅ 已初始化' : '🚀 初始化系统'}
            </Button>
            
            <Button
              onClick={handleGetStrategy}
              disabled={!isInitialized}
              variant="outline"
              className="w-full"
            >
              📊 获取策略建议
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handlePreviewExport}
              disabled={!isInitialized}
              variant="outline"
              className="w-full"
            >
              👁️ 预览导出设置
            </Button>
            
            <Button
              onClick={handleTestSmartExport}
              disabled={!isInitialized || isExporting}
              className="w-full"
            >
              🧠 测试智能导出
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleTestFrontendExport}
              disabled={!isInitialized || isExporting}
              variant="outline"
              className="w-full"
            >
              🌐 测试前端导出
            </Button>
            
            <Button
              onClick={handleTestBackendExport}
              disabled={!isInitialized || isExporting}
              variant="outline"
              className="w-full"
            >
              🖥️ 测试后端导出
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 导出进度 */}
      {isExporting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 animate-pulse" />
              导出进度
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{exportMessage}</span>
                <span>{Math.round(exportProgress * 100)}%</span>
              </div>
              <Progress value={exportProgress * 100} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 导出结果 */}
      {exportResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {exportResult.success !== false ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              导出结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exportResult.type === 'strategy' && (
              <div className="space-y-2">
                <div><strong>主要策略:</strong></div>
                <div className="ml-4 text-sm">
                  <div>方法: {exportResult.data.primary.method}</div>
                  <div>质量: {exportResult.data.primary.quality}</div>
                  <div>原因: {exportResult.data.primary.reason}</div>
                  <div>预估时间: {exportResult.data.primary.estimatedTime}秒</div>
                  <div>预估大小: {(exportResult.data.primary.estimatedSize / 1024 / 1024).toFixed(1)}MB</div>
                </div>
                {exportResult.data.alternatives.length > 0 && (
                  <div>
                    <strong>备选策略:</strong>
                    <div className="ml-4 text-sm">
                      {exportResult.data.alternatives.map((alt: any, index: number) => (
                        <div key={index}>
                          {index + 1}. {alt.method} - {alt.quality} ({alt.reason})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {exportResult.type === 'preview' && (
              <div className="space-y-2">
                <div><strong>导出预览:</strong></div>
                <div className="ml-4 text-sm">
                  <div>策略: {exportResult.data.strategy.method} - {exportResult.data.strategy.quality}</div>
                  <div>预估文件大小: {(exportResult.data.estimatedResult.fileSize / 1024 / 1024).toFixed(1)}MB</div>
                  <div>预估处理时间: {exportResult.data.estimatedResult.duration}秒</div>
                  <div>质量: {exportResult.data.estimatedResult.quality}</div>
                </div>
                {exportResult.data.warnings.length > 0 && (
                  <div>
                    <strong>警告:</strong>
                    <div className="ml-4 text-sm text-yellow-600">
                      {exportResult.data.warnings.map((warning: string, index: number) => (
                        <div key={index}>⚠️ {warning}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!exportResult.type && exportResult.success && (
              <div className="space-y-2">
                <div><strong>导出成功!</strong></div>
                <div className="ml-4 text-sm">
                  <div>方法: {exportResult.method}</div>
                  <div>质量: {exportResult.quality}</div>
                  <div>格式: {exportResult.format}</div>
                  <div>编码器: {exportResult.codec}</div>
                  {exportResult.size && (
                    <div>文件大小: {(exportResult.size / 1024 / 1024).toFixed(1)}MB</div>
                  )}
                  {exportResult.duration && (
                    <div>处理时间: {exportResult.duration.toFixed(1)}秒</div>
                  )}
                </div>
                
                {exportResult.url && (
                  <Button
                    onClick={() => window.open(exportResult.url, '_blank')}
                    className="w-full mt-4"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下载导出文件
                  </Button>
                )}
              </div>
            )}

            {!exportResult.type && !exportResult.success && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  导出失败: {exportResult.error}
                </AlertDescription>
              </Alert>
            )}

            {/* 调试信息 */}
            <details className="text-xs text-gray-500">
              <summary>调试信息</summary>
              <div className="mt-2 p-2 bg-gray-100 rounded">
                <pre>{JSON.stringify(exportResult, null, 2)}</pre>
              </div>
            </details>
          </CardContent>
        </Card>
      )}

      {/* 系统配置信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            系统配置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div><strong>默认用户偏好:</strong></div>
            <div className="ml-4">
              <div>隐私级别: {exportSystemConfig.defaultUserPreference.privacy}</div>
              <div>质量: {exportSystemConfig.defaultUserPreference.quality}</div>
              <div>允许云端处理: {exportSystemConfig.defaultUserPreference.allowCloudProcessing ? '是' : '否'}</div>
            </div>
            
            <div><strong>性能阈值:</strong></div>
            <div className="ml-4">
              <div>最大前端内存: {(exportSystemConfig.performanceThresholds.maxFrontendMemoryUsage / 1024 / 1024 / 1024).toFixed(1)}GB</div>
              <div>最大前端处理时间: {exportSystemConfig.performanceThresholds.maxFrontendProcessingTime}秒</div>
              <div>最大复杂度评分: {exportSystemConfig.performanceThresholds.maxComplexityScore}</div>
              <div>最大文件大小: {(exportSystemConfig.performanceThresholds.maxFileSize / 1024 / 1024).toFixed(1)}MB</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
