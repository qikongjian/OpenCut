// rough-cut-caller.tsx - 粗剪接口调用组件
// 此组件用于在导出完成后调用粗剪视频接口并显示状态
// 文件路径: components/rough-cut-caller.tsx

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
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { callRoughCutAPI, RoughCutCallOptions, RoughCutCallResult, formatTaskResult, validateTaskResult } from '@/lib/rough-cut-client';
import { getSmartToken, initializeTokenSystem } from '@/lib/ai-editing-auth';

/**
 * 粗剪接口调用组件属性
 */
interface RoughCutCallerProps {
  projectId: string;
  videoUrl: string;
  taskName?: string;
  onSuccess?: (result: RoughCutCallResult) => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * 粗剪接口调用状态
 */
type RoughCutCallState = 'idle' | 'calling' | 'success' | 'error' | 'retrying';

/**
 * 粗剪接口调用组件
 */
export function RoughCutCaller({
  projectId: propProjectId,
  videoUrl,
  taskName = 'generate_final_simple_video',
  onSuccess,
  onError,
  className
}: RoughCutCallerProps) {
  // 如果没有传入projectId，尝试从URL获取
  const [projectId, setProjectId] = React.useState<string>(propProjectId || '');
  const [tokenStatus, setTokenStatus] = React.useState<'checking' | 'available' | 'unavailable'>('checking');
  
  React.useEffect(() => {
    if (!propProjectId) {
      // 动态导入项目工具函数
      import('@/lib/project-utils').then(({ getProjectIdWithFallback }) => {
        const urlProjectId = getProjectIdWithFallback();
        setProjectId(urlProjectId);
      });
    }
    
    // 检查token状态
    const checkTokenStatus = async () => {
      try {
        await initializeTokenSystem();
        const tokenInfo = await getSmartToken();
        setTokenStatus(tokenInfo ? 'available' : 'unavailable');
      } catch (error) {
        setTokenStatus('unavailable');
      }
    };
    
    checkTokenStatus();
  }, [propProjectId]);
  const [state, setState] = React.useState<RoughCutCallState>('idle');
  const [progress, setProgress] = React.useState(0);
  const [message, setMessage] = React.useState('');
  const [result, setResult] = React.useState<RoughCutCallResult | null>(null);
  const [error, setError] = React.useState<string>('');

  /**
   * 调用粗剪接口
   */
  const handleCallRoughCut = async () => {
    if (state === 'calling') return;
    
    // 验证项目ID
    if (!projectId || projectId === 'unknown-project') {
      setState('error');
      setError('无法获取有效的项目ID，请检查当前页面URL');
      return;
    }

    setState('calling');
    setProgress(0);
    setMessage('准备调用粗剪视频接口...');
    setError('');

    try {
      const callOptions: RoughCutCallOptions = {
        projectId,
        videoUrl,
        taskName,
        onProgress: (progress) => {
          setProgress(progress.progress);
          setMessage(progress.message);
          
          if (progress.stage === 'retrying') {
            setState('retrying');
          }
        }
      };

      const callResult = await callRoughCutAPI(callOptions);
      setResult(callResult);

      if (callResult.success) {
        setState('success');
        setMessage('粗剪视频接口调用成功！');
        onSuccess?.(callResult);
      } else {
        setState('error');
        setMessage('粗剪视频接口调用失败');
        setError(callResult.error || '未知错误');
        onError?.(callResult.error || '未知错误');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setState('error');
      setMessage('调用粗剪接口异常');
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  /**
   * 重试调用
   */
  const handleRetry = () => {
    setState('idle');
    setProgress(0);
    setMessage('');
    setError('');
    setResult(null);
    handleCallRoughCut();
  };

  /**
   * 获取状态图标
   */
  const getStatusIcon = () => {
    switch (state) {
      case 'idle':
        return <Play className="h-4 w-4" />;
      case 'calling':
      case 'retrying':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  /**
   * 获取状态颜色
   */
  const getStatusColor = () => {
    switch (state) {
      case 'idle':
        return 'bg-gray-100 text-gray-800';
      case 'calling':
      case 'retrying':
        return 'bg-blue-100 text-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * 获取按钮文本
   */
  const getButtonText = () => {
    if (!projectId) {
      return '等待项目ID...';
    }
    
    switch (state) {
      case 'idle':
        return '调用粗剪接口';
      case 'calling':
        return '调用中...';
      case 'retrying':
        return '重试中...';
      case 'success':
        return '调用成功';
      case 'error':
        return '重试';
      default:
        return '调用粗剪接口';
    }
  };

  /**
   * 获取按钮禁用状态
   */
  const isButtonDisabled = () => {
    return state === 'calling' || state === 'retrying' || !projectId;
  };

  /**
   * 获取项目页面类型
   */
  const getProjectPageType = (): string => {
    try {
      const pathname = window.location.pathname;
      
      if (pathname.includes('/editor/')) {
        return 'editor';
      } else if (pathname.includes('/viewer/')) {
        return 'viewer';
      } else if (pathname.includes('/project/')) {
        return 'project';
      } else if (pathname.includes('/settings/')) {
        return 'settings';
      }
      
      return 'unknown';
    } catch {
      return 'unknown';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          粗剪视频接口调用
        </CardTitle>
        <CardDescription>
          在导出完成后调用粗剪视频接口，更新任务状态
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 状态信息 */}
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor()}>
            {state === 'idle' && '待调用'}
            {state === 'calling' && '调用中'}
            {state === 'retrying' && '重试中'}
            {state === 'success' && '成功'}
            {state === 'error' && '失败'}
          </Badge>
          
          {/* Token状态 */}
          <Badge variant={tokenStatus === 'available' ? 'default' : 'secondary'} className={
            tokenStatus === 'available' ? 'bg-green-100 text-green-800' : 
            tokenStatus === 'unavailable' ? 'bg-red-100 text-red-800' : 
            'bg-yellow-100 text-yellow-800'
          }>
            {tokenStatus === 'checking' && '检查Token...'}
            {tokenStatus === 'available' && '🔑 Token可用'}
            {tokenStatus === 'unavailable' && '❌ Token缺失'}
          </Badge>
          
          {result && (
            <Badge variant="outline">
              耗时: {result.duration}ms
            </Badge>
          )}
          
          {result && result.retryCount > 0 && (
            <Badge variant="outline">
              重试: {result.retryCount}次
            </Badge>
          )}
        </div>

        {/* 进度条 */}
        {(state === 'calling' || state === 'retrying') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{message}</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <Progress value={progress * 100} className="w-full" />
          </div>
        )}

        {/* 成功状态 */}
        {state === 'success' && result && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              粗剪视频接口调用成功！
              {result.data && (
                <div className="mt-2 text-sm">
                  <div>响应数据: {JSON.stringify(result.data, null, 2)}</div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 错误状态 */}
        {state === 'error' && error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              调用失败: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 项目信息 */}
        <div className="rounded-lg border p-3 bg-gray-50">
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <strong>项目ID:</strong> 
              {projectId ? (
                <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                  {projectId}
                </span>
              ) : (
                <span className="text-orange-600">正在获取...</span>
              )}
            </div>
            <div><strong>任务名称:</strong> {taskName}</div>
            <div><strong>视频URL:</strong> 
              <span className="break-all">{videoUrl}</span>
            </div>
            <div><strong>页面类型:</strong> 
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {getProjectPageType()}
              </span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            onClick={state === 'error' ? handleRetry : handleCallRoughCut}
            disabled={isButtonDisabled()}
            className="flex-1"
          >
            {getButtonText()}
          </Button>
          
          {state === 'success' && (
            <Button
              variant="outline"
              onClick={() => window.open(videoUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              查看视频
            </Button>
          )}
        </div>

        {/* 调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs text-gray-500">
            <summary>调试信息</summary>
            <div className="mt-2 space-y-1">
              <div>状态: {state}</div>
              <div>进度: {progress}</div>
              <div>消息: {message}</div>
              {result && (
                <div>结果: {JSON.stringify(result, null, 2)}</div>
              )}
              <div>
                <strong>Task Result 格式:</strong>
                <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono">
                  {formatTaskResult(videoUrl)}
                </div>
              </div>
              <div>
                <strong>格式验证:</strong>
                {(() => {
                  const validation = validateTaskResult(formatTaskResult(videoUrl));
                  return (
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      validation.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {validation.valid ? '✓ 有效' : `✗ ${validation.error}`}
                    </span>
                  );
                })()}
              </div>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
