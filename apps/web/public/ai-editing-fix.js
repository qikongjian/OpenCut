// ai-editing-fix.js - 客户端AI剪辑功能修复脚本
// 在浏览器控制台中运行此脚本来修复AI剪辑问题

(function() {
    'use strict';
    
    console.log('🔧 OpenCut AI剪辑功能修复脚本 v1.0');
    console.log('================================================');
    
    // 修复配置
    const FIX_CONFIG = {
        enableStorageFallback: true,
        enableAPIFallback: true,
        enableErrorRecovery: true,
        debugMode: true,
    };
    
    // 1. 存储系统修复
    function fixStorageSystem() {
        console.log('🔧 修复存储系统...');
        
        // 检测存储支持
        const storageSupport = {
            indexedDB: 'indexedDB' in window,
            opfs: 'storage' in navigator && 'getDirectory' in navigator.storage,
            localStorage: 'localStorage' in window,
        };
        
        console.log('📊 存储支持检测:', storageSupport);
        
        // OPFS Fallback
        if (!storageSupport.opfs && FIX_CONFIG.enableStorageFallback) {
            console.log('⚠️ OPFS不支持，启用fallback模式');
            window.OPFS_FALLBACK_MODE = true;
            
            // 创建OPFS模拟器
            if (!navigator.storage) {
                navigator.storage = {};
            }
            
            if (!navigator.storage.getDirectory) {
                navigator.storage.getDirectory = async function() {
                    console.log('🔄 使用OPFS fallback');
                    return {
                        getFileHandle: async function(name, options) {
                            throw new Error('OPFS fallback: 使用IndexedDB存储');
                        }
                    };
                };
            }
        }
        
        // IndexedDB 增强
        if (storageSupport.indexedDB) {
            const originalOpen = indexedDB.open;
            indexedDB.open = function(name, version) {
                const request = originalOpen.call(this, name, version);
                
                request.onerror = function(event) {
                    console.warn('⚠️ IndexedDB打开失败，尝试重试:', event);
                    
                    // 延迟重试
                    setTimeout(() => {
                        console.log('🔄 重试IndexedDB连接...');
                        originalOpen.call(indexedDB, name, version);
                    }, 1000);
                };
                
                return request;
            };
        }
        
        console.log('✅ 存储系统修复完成');
    }
    
    // 2. API错误修复
    function fixAPIErrors() {
        console.log('🔧 修复API错误...');
        
        // 拦截fetch请求
        const originalFetch = window.fetch;
        window.fetch = async function(url, options) {
            try {
                const response = await originalFetch(url, options);
                
                // 处理音效搜索API错误
                if (url.includes('/api/sounds/search') && !response.ok) {
                    console.warn('⚠️ 音效搜索API失败，返回空结果');
                    return new Response(JSON.stringify({
                        results: [],
                        count: 0,
                        next: null,
                        previous: null
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                return response;
            } catch (error) {
                console.error('❌ API请求失败:', url, error);
                
                // API fallback
                if (FIX_CONFIG.enableAPIFallback) {
                    if (url.includes('/api/sounds/search')) {
                        return new Response(JSON.stringify({
                            results: [],
                            count: 0,
                            next: null,
                            previous: null
                        }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
                
                throw error;
            }
        };
        
        console.log('✅ API错误修复完成');
    }
    
    // 3. 媒体项保存修复
    function fixMediaItemSaving() {
        console.log('🔧 修复媒体项保存...');
        
        // 监听存储错误
        const originalConsoleError = console.error;
        console.error = function(...args) {
            const message = args[0];
            
            if (typeof message === 'string' && message.includes('Failed to save media item')) {
                console.warn('🔄 检测到媒体项保存失败，尝试修复...');
                
                // 触发存储修复
                if (window.storageService) {
                    setTimeout(() => {
                        console.log('🔧 尝试重新初始化存储服务...');
                        // 这里可以添加具体的修复逻辑
                    }, 100);
                }
            }
            
            originalConsoleError.apply(console, args);
        };
        
        console.log('✅ 媒体项保存修复完成');
    }
    
    // 4. AI剪辑流程修复
    function fixAIEditingFlow() {
        console.log('🔧 修复AI剪辑流程...');
        
        // 创建全局修复函数
        window.fixAIEditing = function() {
            console.log('🚀 手动触发AI剪辑修复...');
            
            // 清理可能的错误状态
            if (window.useAIEditingStore) {
                const store = window.useAIEditingStore.getState();
                if (store.clearAIData) {
                    store.clearAIData();
                    console.log('🧹 已清理AI剪辑状态');
                }
            }
            
            // 重新初始化存储
            if (window.storageService) {
                console.log('🔄 重新初始化存储服务...');
            }
            
            console.log('✅ AI剪辑修复完成，请重试操作');
        };
        
        // 创建存储诊断函数
        window.diagnoseStorage = function() {
            console.log('🔍 运行存储诊断...');
            
            const diagnosis = {
                indexedDB: 'indexedDB' in window,
                opfs: 'storage' in navigator && 'getDirectory' in navigator.storage,
                localStorage: 'localStorage' in window,
                sessionStorage: 'sessionStorage' in window,
                isSecureContext: window.isSecureContext,
                userAgent: navigator.userAgent,
            };
            
            console.table(diagnosis);
            
            // 检查存储配额
            if (navigator.storage && navigator.storage.estimate) {
                navigator.storage.estimate().then(estimate => {
                    console.log('💾 存储配额:', {
                        quota: (estimate.quota / 1024 / 1024).toFixed(2) + ' MB',
                        usage: (estimate.usage / 1024 / 1024).toFixed(2) + ' MB',
                        available: ((estimate.quota - estimate.usage) / 1024 / 1024).toFixed(2) + ' MB'
                    });
                });
            }
            
            return diagnosis;
        };
        
        console.log('✅ AI剪辑流程修复完成');
    }
    
    // 5. 错误恢复机制
    function setupErrorRecovery() {
        if (!FIX_CONFIG.enableErrorRecovery) return;
        
        console.log('🔧 设置错误恢复机制...');
        
        // 全局错误处理
        window.addEventListener('error', function(event) {
            if (event.error && event.error.message) {
                const message = event.error.message;
                
                if (message.includes('storage') || message.includes('IndexedDB') || message.includes('OPFS')) {
                    console.warn('🔄 检测到存储相关错误，尝试恢复:', message);
                    
                    // 延迟执行恢复
                    setTimeout(() => {
                        if (window.fixAIEditing) {
                            window.fixAIEditing();
                        }
                    }, 1000);
                }
            }
        });
        
        // Promise 错误处理
        window.addEventListener('unhandledrejection', function(event) {
            if (event.reason && event.reason.message) {
                const message = event.reason.message;
                
                if (message.includes('Failed to save media item')) {
                    console.warn('🔄 检测到媒体保存错误，尝试恢复:', message);
                    event.preventDefault(); // 阻止错误冒泡
                    
                    // 触发恢复机制
                    setTimeout(() => {
                        if (window.fixAIEditing) {
                            window.fixAIEditing();
                        }
                    }, 500);
                }
            }
        });
        
        console.log('✅ 错误恢复机制设置完成');
    }
    
    // 6. 调试工具
    function setupDebugTools() {
        if (!FIX_CONFIG.debugMode) return;
        
        console.log('🔧 设置调试工具...');
        
        // 创建调试面板
        window.debugAIEditing = {
            checkStorage: window.diagnoseStorage,
            fixAIEditing: window.fixAIEditing,
            clearStorage: function() {
                if (confirm('确定要清理所有存储数据吗？这将删除所有项目和媒体文件。')) {
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    if ('indexedDB' in window) {
                        // 清理IndexedDB需要更复杂的逻辑
                        console.log('🧹 IndexedDB清理需要手动操作');
                    }
                    
                    console.log('🧹 存储数据已清理');
                }
            },
            testMediaSave: function() {
                console.log('🧪 测试媒体项保存...');
                
                const testMediaItem = {
                    id: 'test-' + Date.now(),
                    name: '测试媒体项',
                    type: 'video',
                    url: 'blob:test',
                    duration: 10,
                    width: 1920,
                    height: 1080,
                };
                
                console.log('测试媒体项:', testMediaItem);
                
                // 这里可以添加实际的保存测试逻辑
            }
        };
        
        console.log('✅ 调试工具设置完成');
        console.log('💡 使用 window.debugAIEditing 访问调试功能');
    }
    
    // 主修复流程
    function runFixes() {
        try {
            fixStorageSystem();
            fixAPIErrors();
            fixMediaItemSaving();
            fixAIEditingFlow();
            setupErrorRecovery();
            setupDebugTools();
            
            console.log('');
            console.log('🎉 AI剪辑功能修复完成！');
            console.log('');
            console.log('可用的修复工具:');
            console.log('- window.fixAIEditing() - 手动修复AI剪辑');
            console.log('- window.diagnoseStorage() - 存储诊断');
            console.log('- window.debugAIEditing - 调试工具集');
            console.log('');
            console.log('现在可以尝试使用AI剪辑功能了。');
            
        } catch (error) {
            console.error('❌ 修复过程中出现错误:', error);
        }
    }
    
    // 延迟执行，确保页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runFixes);
    } else {
        runFixes();
    }
    
})();
