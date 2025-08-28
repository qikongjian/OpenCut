// debug-ai-api.js - AI剪辑计划API调试工具
// 在浏览器控制台中运行此脚本来监控和调试AI API调用

(function() {
    'use strict';
    
    console.log('🔍 AI剪辑计划API调试工具 v1.0');
    console.log('=====================================');
    
    // 调试配置
    const DEBUG_CONFIG = {
        logAllRequests: true,
        logAIAPIOnly: true,
        showRequestDetails: true,
        showResponseDetails: true,
    };
    
    // API监控器
    function setupAPIMonitor() {
        console.log('🔧 设置API监控器...');
        
        // 保存原始fetch
        const originalFetch = window.fetch;
        
        // 拦截所有fetch请求
        window.fetch = async function(url, options) {
            const isAIAPI = url.includes('edit-plan/generate-by-project');
            const shouldLog = DEBUG_CONFIG.logAllRequests || (DEBUG_CONFIG.logAIAPIOnly && isAIAPI);
            
            if (shouldLog) {
                console.group(`🌐 API请求监控: ${isAIAPI ? '🤖 AI剪辑API' : '📡 其他API'}`);
                console.log('📍 URL:', url);
                
                if (DEBUG_CONFIG.showRequestDetails && options) {
                    console.log('🔧 请求方法:', options.method || 'GET');
                    console.log('📋 请求头:', options.headers);
                    
                    if (options.body) {
                        try {
                            const body = JSON.parse(options.body);
                            console.log('📦 请求体:', body);
                        } catch {
                            console.log('📦 请求体:', options.body);
                        }
                    }
                }
                
                console.log('⏰ 请求时间:', new Date().toLocaleTimeString());
            }
            
            try {
                const response = await originalFetch(url, options);
                
                if (shouldLog) {
                    console.log('✅ 响应状态:', response.status, response.statusText);
                    console.log('🔗 响应OK:', response.ok);
                    
                    if (DEBUG_CONFIG.showResponseDetails && isAIAPI) {
                        // 克隆响应以避免消费
                        const responseClone = response.clone();
                        try {
                            const responseData = await responseClone.json();
                            console.log('📦 响应数据:', responseData);
                        } catch (error) {
                            console.log('⚠️ 无法解析响应数据:', error);
                        }
                    }
                    
                    console.groupEnd();
                }
                
                return response;
            } catch (error) {
                if (shouldLog) {
                    console.error('❌ 请求失败:', error);
                    console.groupEnd();
                }
                throw error;
            }
        };
        
        console.log('✅ API监控器设置完成');
    }
    
    // 手动测试AI API
    window.testAIAPI = async function(projectId) {
        if (!projectId) {
            // 尝试从URL获取项目ID
            const urlPath = window.location.pathname;
            const match = urlPath.match(/\/(?:editor|ai-editor)\/([a-f0-9-]+)/);
            projectId = match ? match[1] : null;
            
            if (!projectId) {
                console.error('❌ 请提供项目ID: testAIAPI("your-project-id")');
                return;
            }
        }
        
        console.group('🧪 手动测试AI剪辑计划API');
        console.log('🆔 项目ID:', projectId);
        
        const apiUrl = 'https://77.smartvideo.py.qikongjian.com/edit-plan/generate-by-project';
        const requestData = { project_id: projectId };
        
        console.log('📡 API地址:', apiUrl);
        console.log('📦 请求数据:', requestData);
        console.log('⏰ 开始时间:', new Date().toLocaleTimeString());
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
            
            console.log('📡 响应状态:', response.status, response.statusText);
            console.log('🔗 响应OK:', response.ok);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API调用成功!');
                console.log('📊 响应数据概览:');
                console.log('- 代码:', data.code);
                console.log('- 消息:', data.message);
                console.log('- 成功:', data.successful);
                
                if (data.data) {
                    console.log('- 项目ID:', data.data.project_id);
                    console.log('- 处理成功:', data.data.success);
                    
                    if (data.data.editing_plan?.editing_sequence_plans) {
                        console.log('- 剪辑计划数量:', data.data.editing_plan.editing_sequence_plans.length);
                        const firstPlan = data.data.editing_plan.editing_sequence_plans[0];
                        if (firstPlan?.timeline_clips) {
                            console.log('- 视频片段数量:', firstPlan.timeline_clips.length);
                        }
                    }
                }
                
                console.log('📋 完整响应数据:', data);
            } else {
                console.error('❌ API调用失败:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('❌ 错误详情:', errorText);
            }
        } catch (error) {
            console.error('❌ 网络错误:', error);
        }
        
        console.log('⏰ 结束时间:', new Date().toLocaleTimeString());
        console.groupEnd();
    };
    
    // 检查当前页面状态
    window.checkAIEditingStatus = function() {
        console.group('🔍 AI剪辑状态检查');
        
        // 检查URL
        const urlPath = window.location.pathname;
        const projectIdMatch = urlPath.match(/\/(?:editor|ai-editor)\/([a-f0-9-]+)/);
        const projectId = projectIdMatch ? projectIdMatch[1] : null;
        
        console.log('📍 当前页面:', urlPath);
        console.log('🆔 项目ID:', projectId || '未找到');
        
        // 检查AI编辑store状态
        if (window.useAIEditingStore) {
            try {
                const store = window.useAIEditingStore.getState();
                console.log('🏪 AI编辑Store状态:');
                console.log('- 是否加载中:', store.isLoadingPlan);
                console.log('- 当前剪辑计划:', store.currentEditingPlan ? '已加载' : '未加载');
                console.log('- AI编辑数据:', store.aiEditingData ? '已加载' : '未加载');
            } catch (error) {
                console.log('⚠️ 无法访问AI编辑Store:', error);
            }
        } else {
            console.log('⚠️ AI编辑Store未找到');
        }
        
        // 检查自动AI编辑store状态
        if (window.useAutoAIEditingStore) {
            try {
                const autoStore = window.useAutoAIEditingStore.getState();
                console.log('🤖 自动AI编辑Store状态:');
                console.log('- 当前阶段:', autoStore.currentStage);
                console.log('- 是否运行中:', autoStore.isRunning);
                console.log('- 进度:', autoStore.progress);
            } catch (error) {
                console.log('⚠️ 无法访问自动AI编辑Store:', error);
            }
        } else {
            console.log('⚠️ 自动AI编辑Store未找到');
        }
        
        console.groupEnd();
    };
    
    // 强制重新生成AI剪辑计划
    window.forceGenerateAIPlan = async function(projectId) {
        if (!projectId) {
            const urlPath = window.location.pathname;
            const match = urlPath.match(/\/(?:editor|ai-editor)\/([a-f0-9-]+)/);
            projectId = match ? match[1] : null;
            
            if (!projectId) {
                console.error('❌ 请提供项目ID: forceGenerateAIPlan("your-project-id")');
                return;
            }
        }
        
        console.log('🚀 强制重新生成AI剪辑计划...');
        
        if (window.useAIEditingStore) {
            try {
                const store = window.useAIEditingStore.getState();
                await store.generateAIEditingPlanFromAPI(projectId);
                console.log('✅ AI剪辑计划生成完成');
            } catch (error) {
                console.error('❌ AI剪辑计划生成失败:', error);
            }
        } else {
            console.error('❌ AI编辑Store未找到');
        }
    };
    
    // 初始化调试工具
    function initDebugTools() {
        setupAPIMonitor();
        
        console.log('');
        console.log('🎉 AI API调试工具初始化完成！');
        console.log('');
        console.log('可用的调试命令:');
        console.log('- testAIAPI(projectId) - 手动测试AI API');
        console.log('- checkAIEditingStatus() - 检查AI编辑状态');
        console.log('- forceGenerateAIPlan(projectId) - 强制重新生成计划');
        console.log('');
        console.log('💡 提示: 如果不提供projectId，会自动从URL获取');
        console.log('');
    }
    
    // 延迟执行，确保页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDebugTools);
    } else {
        initDebugTools();
    }
    
})();
