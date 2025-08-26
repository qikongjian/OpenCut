// export-debug.js - 导出问题诊断脚本
// 专门用于调试AI剪辑导出失败的问题

(function() {
    'use strict';
    
    console.log('🔧 导出问题诊断脚本 v1.0');
    console.log('===============================');
    
    // 诊断配置
    const DEBUG_CONFIG = {
        interceptFetch: true,
        logStreamEvents: true,
        validateExportData: true,
        monitorProgress: true,
    };
    
    // 1. 拦截并监控导出请求
    function interceptExportRequests() {
        console.log('🕵️ 开始拦截导出请求...');
        
        const originalFetch = window.fetch;
        window.fetch = async function(url, options) {
            // 监控增量导出API
            if (url.includes('/api/export/incremental')) {
                console.log('🎯 拦截增量导出请求:', {
                    url,
                    method: options?.method,
                    hasBody: !!options?.body
                });
                
                if (options?.body instanceof FormData) {
                    console.log('📦 FormData内容:');
                    for (const [key, value] of options.body.entries()) {
                        if (key === 'requestData') {
                            try {
                                const data = JSON.parse(value);
                                console.log(`  - ${key}: 解析成功`, {
                                    exportType: data.exportType,
                                    videoCount: data.timeline?.ir?.video?.length,
                                    textCount: data.timeline?.ir?.texts?.length,
                                    processedMediaCount: data.processedMedia?.length
                                });
                            } catch (e) {
                                console.log(`  - ${key}: 解析失败`, e);
                            }
                        } else if (value instanceof File) {
                            console.log(`  - ${key}: File(${value.name}, ${value.size} bytes)`);
                        } else {
                            console.log(`  - ${key}: ${typeof value}`);
                        }
                    }
                }
                
                try {
                    const response = await originalFetch.call(this, url, options);
                    console.log('📡 增量导出响应:', {
                        status: response.status,
                        statusText: response.statusText,
                        ok: response.ok,
                        headers: Object.fromEntries(response.headers.entries())
                    });
                    
                    // 如果是流式响应，监控流内容
                    if (response.body && response.headers.get('content-type')?.includes('text/event-stream')) {
                        return monitorStreamResponse(response);
                    }
                    
                    return response;
                } catch (error) {
                    console.error('❌ 增量导出请求失败:', error);
                    throw error;
                }
            }
            
            // 监控下载请求
            if (url.includes('/api/export/download/')) {
                console.log('📥 拦截下载请求:', url);
                
                try {
                    const response = await originalFetch.call(this, url, options);
                    console.log('📥 下载响应:', {
                        status: response.status,
                        statusText: response.statusText,
                        ok: response.ok,
                        contentLength: response.headers.get('content-length'),
                        contentType: response.headers.get('content-type')
                    });
                    return response;
                } catch (error) {
                    console.error('❌ 下载请求失败:', error);
                    throw error;
                }
            }
            
            return originalFetch.call(this, url, options);
        };
        
        console.log('✅ 导出请求拦截已启用');
    }
    
    // 2. 监控流式响应
    function monitorStreamResponse(response) {
        console.log('📡 开始监控流式响应...');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        const stream = new ReadableStream({
            start(controller) {
                function pump() {
                    return reader.read().then(({ done, value }) => {
                        if (done) {
                            console.log('📡 流式响应结束');
                            controller.close();
                            return;
                        }
                        
                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n');
                        
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    console.log('📡 流事件:', data);
                                    
                                    if (data.type === 'complete') {
                                        console.log('🎉 收到完成事件:', {
                                            downloadUrl: data.downloadUrl,
                                            fileSize: data.fileSize,
                                            hasDownloadUrl: !!data.downloadUrl
                                        });
                                    } else if (data.type === 'error') {
                                        console.error('❌ 收到错误事件:', data);
                                    }
                                } catch (e) {
                                    console.warn('⚠️ 无法解析流数据:', line);
                                }
                            }
                        }
                        
                        controller.enqueue(value);
                        return pump();
                    });
                }
                
                return pump();
            }
        });
        
        return new Response(stream, {
            headers: response.headers
        });
    }
    
    // 3. 验证导出数据
    function validateExportData() {
        console.log('🔍 验证导出数据...');
        
        try {
            // 检查时间轴状态
            if (typeof window.useTimelineStore !== 'undefined') {
                const timelineStore = window.useTimelineStore.getState();
                const ir = timelineStore.toIR();
                
                console.log('📊 时间轴状态:', {
                    tracksCount: timelineStore.tracks.length,
                    videoElements: ir.video.length,
                    audioElements: ir.audio.length,
                    textElements: ir.texts.length,
                    totalDuration: ir.duration
                });
                
                // 检查视频元素
                ir.video.forEach((video, index) => {
                    console.log(`📹 视频 ${index + 1}:`, {
                        id: video.id,
                        startTime: video.startTime,
                        duration: video.duration,
                        hasTransform: !!video.transform,
                        transform: video.transform
                    });
                });
                
                // 检查媒体库状态
                if (typeof window.useMediaStore !== 'undefined') {
                    const mediaStore = window.useMediaStore.getState();
                    console.log('📚 媒体库状态:', {
                        itemsCount: mediaStore.items.length,
                        hasLocalFiles: mediaStore.items.filter(item => item.file).length,
                        hasBlobUrls: mediaStore.items.filter(item => item.url?.startsWith('blob:')).length
                    });
                }
                
                return { valid: true, ir, timelineStore };
            } else {
                console.warn('⚠️ 无法访问时间轴存储');
                return { valid: false };
            }
        } catch (error) {
            console.error('❌ 验证导出数据失败:', error);
            return { valid: false, error };
        }
    }
    
    // 4. 监控导出进度
    function monitorExportProgress() {
        console.log('📈 开始监控导出进度...');
        
        // 拦截控制台错误
        const originalConsoleError = console.error;
        console.error = function(...args) {
            const message = args[0];
            if (typeof message === 'string' && message.includes('导出失败')) {
                console.log('🚨 检测到导出失败:', ...args);
            }
            originalConsoleError.apply(console, args);
        };
        
        // 监听导出管理器状态
        if (typeof window.useExportStore !== 'undefined') {
            const exportStore = window.useExportStore.getState();
            console.log('📤 导出存储状态:', exportStore);
        }
        
        console.log('✅ 导出进度监控已启用');
    }
    
    // 5. 创建诊断工具
    function createDiagnosticTools() {
        console.log('🛠️ 创建诊断工具...');
        
        // 手动触发导出测试
        window.testExport = async function() {
            console.log('🧪 开始导出测试...');
            
            const validation = validateExportData();
            if (!validation.valid) {
                console.error('❌ 导出数据验证失败');
                return;
            }
            
            console.log('✅ 导出数据验证通过，可以尝试导出');
            
            // 模拟点击导出按钮
            const exportButton = document.querySelector('[data-testid="export-button"]') || 
                                document.querySelector('button:contains("导出")');
            
            if (exportButton) {
                console.log('🖱️ 模拟点击导出按钮');
                exportButton.click();
            } else {
                console.warn('⚠️ 找不到导出按钮');
            }
        };
        
        // 检查服务器状态
        window.checkServerStatus = async function() {
            console.log('🏥 检查服务器状态...');
            
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                console.log('✅ 服务器状态:', data);
            } catch (error) {
                console.error('❌ 服务器状态检查失败:', error);
            }
        };
        
        // 清理临时文件
        window.cleanupTempFiles = async function() {
            console.log('🧹 清理临时文件...');
            
            try {
                const response = await fetch('/api/cleanup', { method: 'POST' });
                const data = await response.json();
                console.log('✅ 清理结果:', data);
            } catch (error) {
                console.error('❌ 清理失败:', error);
            }
        };
        
        console.log('✅ 诊断工具创建完成');
    }
    
    // 6. 主诊断流程
    function runDiagnostics() {
        try {
            console.log('🚀 开始导出问题诊断...');
            
            // 启用所有诊断功能
            if (DEBUG_CONFIG.interceptFetch) {
                interceptExportRequests();
            }
            
            if (DEBUG_CONFIG.validateExportData) {
                const validation = validateExportData();
                if (!validation.valid) {
                    console.warn('⚠️ 导出数据验证失败，可能影响导出');
                }
            }
            
            if (DEBUG_CONFIG.monitorProgress) {
                monitorExportProgress();
            }
            
            createDiagnosticTools();
            
            console.log('');
            console.log('🎉 导出问题诊断已启动！');
            console.log('');
            console.log('可用的诊断工具:');
            console.log('- window.testExport() - 测试导出功能');
            console.log('- window.checkServerStatus() - 检查服务器状态');
            console.log('- window.cleanupTempFiles() - 清理临时文件');
            console.log('');
            console.log('💡 现在可以尝试导出，所有过程都会被详细记录');
            
        } catch (error) {
            console.error('❌ 诊断启动失败:', error);
        }
    }
    
    // 延迟执行，确保页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runDiagnostics);
    } else {
        runDiagnostics();
    }
    
})();
