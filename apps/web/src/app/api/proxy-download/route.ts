// proxy-download API route - 代理下载API
// 此文件包含 代理下载功能 的相关代码
// 文件路径: app/api/proxy-download/route.ts
// 最后更新: 2025/1/8

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    console.log(`🔄 代理下载请求: ${targetUrl}`);

    // 验证URL是否为允许的域名（安全检查）
    const allowedDomains = [
      'video-base-imf.oss-ap-southeast-7.aliyuncs.com',
      'oss-ap-southeast-7.aliyuncs.com'
    ];
    
    const urlObj = new URL(targetUrl);
    const isAllowedDomain = allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowedDomain) {
      console.error(`❌ 不允许的域名: ${urlObj.hostname}`);
      return NextResponse.json(
        { error: 'Domain not allowed' },
        { status: 403 }
      );
    }

    // 发起代理请求
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'OpenCut-Video-Editor/1.0',
        'Accept': 'video/mp4,video/*,*/*',
      },
    });

    if (!response.ok) {
      console.error(`❌ 代理请求失败: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Proxy request failed: ${response.status}` },
        { status: response.status }
      );
    }

    // 获取响应数据
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentLength = response.headers.get('content-length');
    
    console.log(`✅ 代理下载成功: ${arrayBuffer.byteLength} bytes`);

    // 返回文件数据
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength || arrayBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ 代理下载错误:', error);
    return NextResponse.json(
      { error: 'Proxy download failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
