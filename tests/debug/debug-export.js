#!/usr/bin/env node

// 调试导出问题的脚本
// 用于分析终端输出和诊断视频导出问题

const fs = require('fs');
const path = require('path');

console.log('🔍 OpenCut 导出问题诊断工具');
console.log('================================');

// 分析终端输出
function analyzeTerminalOutput() {
  console.log('\n📊 终端输出分析:');
  
  // 从终端信息分析关键指标
  const analysis = {
    ffmpegExitCode: 0, // FFmpeg进程正常退出
    outputFileSize: 450491, // 261KB，异常小
    videoStats: {
      iFramePercentage: 94.2, // I帧比例异常高
      pFramePercentage: 0.0,  // P帧几乎为0
      bFramePercentage: 4.4   // B帧正常
    },
    audioStats: {
      present: true, // 有音频轨道
      bitrate: '128k'
    }
  };
  
  console.log('✅ FFmpeg 进程状态: 正常退出 (code 0)');
  console.log(`⚠️  输出文件大小: ${analysis.outputFileSize} bytes (${(analysis.outputFileSize/1024).toFixed(1)}KB)`);
  console.log(`❌ I帧比例异常: ${analysis.videoStats.iFramePercentage}% (正常应该 < 50%)`);
  console.log(`❌ P帧比例异常: ${analysis.videoStats.pFramePercentage}% (正常应该 > 30%)`);
  
  return analysis;
}

// 诊断可能的问题
function diagnoseProblem(analysis) {
  console.log('\n🔧 问题诊断:');
  
  const problems = [];
  const solutions = [];
  
  // 文件大小异常
  if (analysis.outputFileSize < 1000000) { // 小于1MB
    problems.push('输出文件过小，可能是占位符视频');
    solutions.push('检查输入文件是否正确传递到后端');
  }
  
  // I帧比例异常
  if (analysis.videoStats.iFramePercentage > 80) {
    problems.push('I帧比例过高，视频内容可能是静态的');
    solutions.push('验证输入视频文件是否有实际内容');
  }
  
  // P帧缺失
  if (analysis.videoStats.pFramePercentage < 5) {
    problems.push('P帧缺失，表明视频没有运动内容');
    solutions.push('检查是否使用了占位符视频（纯色填充）');
  }
  
  console.log('❌ 发现的问题:');
  problems.forEach((problem, i) => {
    console.log(`   ${i + 1}. ${problem}`);
  });
  
  console.log('\n💡 建议的解决方案:');
  solutions.forEach((solution, i) => {
    console.log(`   ${i + 1}. ${solution}`);
  });
  
  return { problems, solutions };
}

// 生成修复建议
function generateFixSuggestions() {
  console.log('\n🛠️  具体修复步骤:');
  
  const steps = [
    '1. 检查前端文件上传逻辑',
    '   - 验证文件是否正确转换为Base64',
    '   - 确认FormData中包含实际文件数据',
    '',
    '2. 检查后端文件处理逻辑',
    '   - 验证uploadedFiles.get()是否返回有效文件',
    '   - 确认文件写入磁盘后大小正确',
    '   - 添加文件头验证',
    '',
    '3. 增强调试信息',
    '   - 在每个文件处理步骤添加详细日志',
    '   - 验证文件内容而不是仅检查大小',
    '   - 记录FFmpeg输入文件的实际内容',
    '',
    '4. 测试建议',
    '   - 使用小的测试视频文件',
    '   - 检查浏览器开发者工具的网络请求',
    '   - 验证服务器端接收到的文件数据'
  ];
  
  steps.forEach(step => console.log(step));
}

// 主函数
function main() {
  const analysis = analyzeTerminalOutput();
  const diagnosis = diagnoseProblem(analysis);
  generateFixSuggestions();
  
  console.log('\n🎯 结论:');
  console.log('根据终端输出分析，问题很可能是：');
  console.log('1. 输入文件数据没有正确传递到FFmpeg');
  console.log('2. 系统回退到创建占位符视频（灰色画面）');
  console.log('3. 占位符视频只有颜色填充，没有实际视频内容');
  console.log('');
  console.log('建议优先检查文件上传和处理逻辑。');
}

// 运行诊断
main();
