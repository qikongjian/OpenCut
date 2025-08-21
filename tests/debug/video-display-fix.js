/**
 * OpenCut 视频显示问题修复脚本
 * 解决部署后时间轴显示字幕但不显示视频的问题
 */

// 问题分析和修复方案
const VIDEO_DISPLAY_ISSUES = {
  // 问题1: Blob URL在服务器环境中失效
  BLOB_URL_ISSUE: {
    description: "视频文件使用blob: URL，在服务器环境中无法访问",
    symptoms: [
      "时间轴显示视频元素但预览区域空白",
      "控制台显示视频加载成功但不显示",
      "视频文件路径为blob:开头的URL"
    ],
    solutions: [
      "将blob URL转换为服务器可访问的文件路径",
      "实现文件上传到服务器存储",
      "修改视频播放器组件的URL处理逻辑"
    ]
  },

  // 问题2: 文件存储路径问题
  FILE_STORAGE_ISSUE: {
    description: "视频文件没有正确存储到服务器文件系统",
    symptoms: [
      "服务器uploads目录为空",
      "404错误访问视频文件",
      "文件只存在于浏览器本地存储"
    ],
    solutions: [
      "实现服务器端文件上传API",
      "配置正确的文件存储路径",
      "设置适当的文件访问权限"
    ]
  },

  // 问题3: 静态文件服务配置
  STATIC_FILE_SERVING: {
    description: "Nginx或应用服务器没有正确配置静态文件服务",
    symptoms: [
      "直接访问文件URL返回404",
      "Nginx配置缺少uploads路径",
      "文件MIME类型不正确"
    ],
    solutions: [
      "配置Nginx静态文件服务",
      "添加uploads路径的代理配置",
      "设置正确的MIME类型"
    ]
  }
};

// 修复步骤
const REPAIR_STEPS = {
  // 步骤1: 检测问题
  DETECT_ISSUES: {
    name: "问题检测",
    actions: [
      "检查视频元素的URL类型",
      "验证服务器文件存储状态",
      "测试静态文件访问",
      "分析浏览器控制台错误"
    ]
  },

  // 步骤2: 修复文件存储
  FIX_FILE_STORAGE: {
    name: "修复文件存储",
    actions: [
      "创建服务器端文件上传API",
      "实现blob到文件的转换",
      "配置文件存储目录",
      "设置文件访问权限"
    ]
  },

  // 步骤3: 修复静态文件服务
  FIX_STATIC_SERVING: {
    name: "修复静态文件服务",
    actions: [
      "配置Nginx静态文件路径",
      "添加uploads目录代理",
      "设置正确的MIME类型",
      "配置缓存策略"
    ]
  },

  // 步骤4: 修复前端代码
  FIX_FRONTEND_CODE: {
    name: "修复前端代码",
    actions: [
      "修改视频播放器URL处理",
      "实现文件上传功能",
      "添加错误处理和重试机制",
      "优化文件加载策略"
    ]
  }
};

// 诊断函数
function diagnoseVideoDisplayIssue() {
  console.log("🔍 开始诊断视频显示问题...");
  
  const diagnosis = {
    timestamp: new Date().toISOString(),
    issues: [],
    recommendations: []
  };

  // 检查视频元素
  const videoElements = document.querySelectorAll('video');
  console.log(`📹 发现 ${videoElements.length} 个视频元素`);

  videoElements.forEach((video, index) => {
    const src = video.src;
    console.log(`视频 ${index + 1}: ${src}`);
    
    if (src.startsWith('blob:')) {
      diagnosis.issues.push({
        type: 'BLOB_URL_ISSUE',
        element: `video[${index}]`,
        src: src,
        severity: 'high'
      });
    }
    
    if (!src || src === '') {
      diagnosis.issues.push({
        type: 'MISSING_SRC',
        element: `video[${index}]`,
        severity: 'critical'
      });
    }
  });

  // 检查时间轴元素
  const timelineElements = document.querySelectorAll('[data-element-id]');
  console.log(`⏱️ 发现 ${timelineElements.length} 个时间轴元素`);

  // 检查媒体存储
  if (typeof window !== 'undefined' && window.localStorage) {
    const mediaItems = localStorage.getItem('media-items');
    if (mediaItems) {
      try {
        const items = JSON.parse(mediaItems);
        console.log(`💾 本地存储中有 ${items.length} 个媒体项`);
        
        items.forEach((item, index) => {
          if (item.type === 'video' && item.url && item.url.startsWith('blob:')) {
            diagnosis.issues.push({
              type: 'LOCAL_BLOB_STORAGE',
              item: `media[${index}]`,
              name: item.name,
              severity: 'medium'
            });
          }
        });
      } catch (e) {
        console.error('解析媒体项失败:', e);
      }
    }
  }

  // 生成建议
  if (diagnosis.issues.length > 0) {
    diagnosis.recommendations = generateRecommendations(diagnosis.issues);
  }

  console.log("📋 诊断结果:", diagnosis);
  return diagnosis;
}

// 生成修复建议
function generateRecommendations(issues) {
  const recommendations = [];
  
  const hasBlobIssues = issues.some(issue => 
    issue.type === 'BLOB_URL_ISSUE' || issue.type === 'LOCAL_BLOB_STORAGE'
  );
  
  if (hasBlobIssues) {
    recommendations.push({
      priority: 'high',
      action: 'implement_file_upload',
      description: '实现文件上传到服务器功能',
      steps: [
        '创建文件上传API端点',
        '修改前端上传逻辑',
        '更新视频播放器URL处理',
        '配置服务器文件存储'
      ]
    });
  }

  const hasMissingSrc = issues.some(issue => issue.type === 'MISSING_SRC');
  
  if (hasMissingSrc) {
    recommendations.push({
      priority: 'critical',
      action: 'fix_video_src',
      description: '修复视频源路径问题',
      steps: [
        '检查视频元素的src属性设置',
        '验证媒体项的URL生成逻辑',
        '确保视频文件正确加载',
        '添加错误处理和回退机制'
      ]
    });
  }

  return recommendations;
}

// 自动修复函数（仅限开发环境）
function attemptAutoFix() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ 自动修复功能仅在开发环境中可用');
    return;
  }

  console.log("🔧 尝试自动修复...");

  // 修复1: 重新加载视频元素
  const videoElements = document.querySelectorAll('video');
  videoElements.forEach((video, index) => {
    if (video.src.startsWith('blob:')) {
      console.log(`🔄 重新加载视频 ${index + 1}`);
      video.load();
    }
  });

  // 修复2: 触发重新渲染
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('video-refresh', {
      detail: { timestamp: Date.now() }
    }));
  }

  console.log("✅ 自动修复完成");
}

// 生成修复报告
function generateFixReport() {
  const diagnosis = diagnoseVideoDisplayIssue();
  
  const report = {
    title: "OpenCut 视频显示问题修复报告",
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: diagnosis.issues.length,
      criticalIssues: diagnosis.issues.filter(i => i.severity === 'critical').length,
      highIssues: diagnosis.issues.filter(i => i.severity === 'high').length,
      mediumIssues: diagnosis.issues.filter(i => i.severity === 'medium').length
    },
    issues: diagnosis.issues,
    recommendations: diagnosis.recommendations,
    nextSteps: [
      "运行服务器端修复脚本: ./fix-video-display.sh",
      "检查Nginx配置文件",
      "验证文件上传功能",
      "测试视频播放功能",
      "清除浏览器缓存并重新测试"
    ]
  };

  console.log("📄 修复报告:", report);
  
  // 如果在浏览器环境中，可以下载报告
  if (typeof window !== 'undefined' && window.Blob) {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-display-fix-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("📥 修复报告已下载");
  }

  return report;
}

// 导出函数供外部使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VIDEO_DISPLAY_ISSUES,
    REPAIR_STEPS,
    diagnoseVideoDisplayIssue,
    generateRecommendations,
    attemptAutoFix,
    generateFixReport
  };
}

// 如果在浏览器环境中直接运行
if (typeof window !== 'undefined') {
  window.VideoDisplayFix = {
    diagnose: diagnoseVideoDisplayIssue,
    autoFix: attemptAutoFix,
    generateReport: generateFixReport
  };
  
  console.log("🛠️ 视频显示修复工具已加载");
  console.log("使用方法:");
  console.log("  VideoDisplayFix.diagnose() - 诊断问题");
  console.log("  VideoDisplayFix.autoFix() - 尝试自动修复");
  console.log("  VideoDisplayFix.generateReport() - 生成修复报告");
}
