'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { initFFmpeg } from '@/lib/ffmpeg';

export default function TestFFmpegPage() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const testFFmpeg = async () => {
    setIsLoading(true);
    setStatus('Testing FFmpeg initialization...');
    setDebugInfo([]);
    
    try {
      addDebugInfo('Starting FFmpeg test...');
      
      // 检查浏览器支持
      if (typeof WebAssembly === 'undefined') {
        throw new Error('WebAssembly is not supported in this browser');
      }
      addDebugInfo('WebAssembly is supported');
      
      // 测试文件是否存在
      addDebugInfo('Checking FFmpeg files...');
      const coreJsResponse = await fetch('/ffmpeg/ffmpeg-core.js');
      const wasmResponse = await fetch('/ffmpeg/ffmpeg-core.wasm');
      
      addDebugInfo(`FFmpeg core.js status: ${coreJsResponse.status}`);
      addDebugInfo(`FFmpeg core.wasm status: ${wasmResponse.status}`);
      
      if (!coreJsResponse.ok) {
        throw new Error(`FFmpeg core.js not found: ${coreJsResponse.status}`);
      }
      
      if (!wasmResponse.ok) {
        throw new Error(`FFmpeg core.wasm not found: ${wasmResponse.status}`);
      }
      
      addDebugInfo('FFmpeg files are accessible');
      setStatus('Files found, initializing FFmpeg...');
      
      // 初始化FFmpeg
      addDebugInfo('Creating FFmpeg instance...');
      const ffmpeg = await initFFmpeg();
      
      if (ffmpeg) {
        addDebugInfo('FFmpeg instance created successfully');
        setStatus('✅ FFmpeg initialized successfully!');
        console.log('FFmpeg test successful:', ffmpeg);
        
        // 测试基本功能
        addDebugInfo('Testing basic FFmpeg functionality...');
        try {
          // 测试一个简单的命令
          await ffmpeg.exec(['-version']);
          addDebugInfo('FFmpeg command execution successful');
        } catch (execError) {
          addDebugInfo(`FFmpeg command execution failed: ${execError}`);
        }
      } else {
        throw new Error('FFmpeg instance is null');
      }
      
    } catch (error) {
      console.error('FFmpeg test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`❌ FFmpeg test failed: ${errorMessage}`);
      addDebugInfo(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearDebug = () => {
    setDebugInfo([]);
    setStatus('Ready to test');
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">FFmpeg Test Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>FFmpeg Initialization Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={testFFmpeg} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Testing...' : 'Test FFmpeg'}
              </Button>
              <Button 
                onClick={clearDebug} 
                variant="outline"
                disabled={isLoading}
              >
                Clear
              </Button>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-mono">{status}</p>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p>This test will:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Check WebAssembly support</li>
                <li>Verify FFmpeg files are accessible</li>
                <li>Initialize FFmpeg instance</li>
                <li>Test basic command execution</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              {debugInfo.length === 0 ? (
                <p className="text-muted-foreground text-sm">No debug information yet. Click "Test FFmpeg" to start.</p>
              ) : (
                <div className="space-y-1">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="text-xs font-mono bg-background p-2 rounded border">
                      {info}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 