// ai-clips-test/route.ts - 简化版AI剪辑导出测试API
// 用于测试AI剪辑导出的基本功能
// 文件路径: app/api/export/ai-clips-test/route.ts

import { NextRequest } from "next/server";

/**
 * 简化版AI剪辑导出测试API - POST请求
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log('🧪 AI clips test export API called');
        const requestData = await req.json();
        
        console.log('📦 Request data received:', {
          clipsCount: requestData.clips?.length,
          totalDuration: requestData.totalDuration,
          quality: requestData.options?.quality,
        });

        // 发送开始事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          stage: 'starting',
          message: '开始测试导出...',
          progress: 0,
        })}\n\n`));

        // 模拟处理过程
        await new Promise(resolve => setTimeout(resolve, 1000));

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          stage: 'processing',
          message: '处理中...',
          progress: 0.5,
        })}\n\n`));

        await new Promise(resolve => setTimeout(resolve, 1000));

        // 发送完成事件（模拟）
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          downloadUrl: '/api/export/download/test',
          size: 1024 * 1024, // 1MB
          duration: requestData.totalDuration || 145,
        })}\n\n`));

        console.log('✅ Test export completed successfully');

      } catch (error) {
        console.error('❌ Test export error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
