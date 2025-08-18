// device-detection.ts - 设备检测和性能评估
// 此文件负责检测用户设备性能和浏览器能力
// 文件路径: lib/export/device-detection.ts

import { DeviceInfo, DevicePerformance, NetworkSpeed } from "@/types/export";

/**
 * 检测设备信息和性能
 */
export async function detectDeviceInfo(): Promise<DeviceInfo> {
  const deviceInfo: DeviceInfo = {
    availableMemory: await getAvailableMemory(),
    cpuCores: getCPUCores(),
    isLowEndDevice: false,
    networkSpeed: await getNetworkSpeed(),
    isOnline: navigator.onLine,
    supportsWebCodecs: checkWebCodecsSupport(),
    supportsOffscreenCanvas: checkOffscreenCanvasSupport(),
    supportsWebWorkers: checkWebWorkersSupport(),
    supportsWasm: checkWasmSupport(),
    performanceLevel: 'medium',
    userAgent: navigator.userAgent,
    browserName: getBrowserName(),
    browserVersion: getBrowserVersion(),
  };

  // 评估设备性能级别
  deviceInfo.performanceLevel = evaluatePerformanceLevel(deviceInfo);
  deviceInfo.isLowEndDevice = deviceInfo.performanceLevel === 'low';

  return deviceInfo;
}

/**
 * 获取可用内存（字节）
 */
async function getAvailableMemory(): Promise<number> {
  // 尝试使用 Performance Memory API
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    if (memory && memory.usedJSHeapSize && memory.totalJSHeapSize) {
      return memory.totalJSHeapSize - memory.usedJSHeapSize;
    }
  }

  // 尝试使用 Navigator Device Memory API
  if ('deviceMemory' in navigator) {
    const deviceMemory = (navigator as any).deviceMemory;
    if (typeof deviceMemory === 'number') {
      // deviceMemory 返回的是GB，转换为字节
      return deviceMemory * 1024 * 1024 * 1024;
    }
  }

  // 回退到经验估算
  return estimateMemoryFromUserAgent();
}

/**
 * 获取CPU核心数
 */
function getCPUCores(): number {
  return navigator.hardwareConcurrency || 4; // 默认4核
}

/**
 * 检测网络速度
 */
async function getNetworkSpeed(): Promise<NetworkSpeed> {
  // 尝试使用 Network Information API
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection && connection.effectiveType) {
      switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
          return 'slow';
        case '3g':
          return 'medium';
        case '4g':
        case '5g':
          return 'fast';
        default:
          return 'medium';
      }
    }
  }

  // 回退到简单的延迟测试
  try {
    const startTime = performance.now();
    await fetch('/api/health', { method: 'HEAD' });
    const latency = performance.now() - startTime;
    
    if (latency < 100) return 'fast';
    if (latency < 300) return 'medium';
    return 'slow';
  } catch {
    return 'medium'; // 默认中等速度
  }
}

/**
 * 检查WebCodecs支持
 */
function checkWebCodecsSupport(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined';
}

/**
 * 检查OffscreenCanvas支持
 */
function checkOffscreenCanvasSupport(): boolean {
  return typeof OffscreenCanvas !== 'undefined';
}

/**
 * 检查Web Workers支持
 */
function checkWebWorkersSupport(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * 检查WebAssembly支持
 */
function checkWasmSupport(): boolean {
  return typeof WebAssembly !== 'undefined';
}

/**
 * 获取浏览器名称
 */
function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown';
}

/**
 * 获取浏览器版本
 */
function getBrowserVersion(): string {
  const userAgent = navigator.userAgent;
  const browserName = getBrowserName();
  
  let match: RegExpMatchArray | null = null;
  
  switch (browserName) {
    case 'Chrome':
      match = userAgent.match(/Chrome\/(\d+)/);
      break;
    case 'Firefox':
      match = userAgent.match(/Firefox\/(\d+)/);
      break;
    case 'Safari':
      match = userAgent.match(/Version\/(\d+)/);
      break;
    case 'Edge':
      match = userAgent.match(/Edg\/(\d+)/);
      break;
    case 'Opera':
      match = userAgent.match(/Opera\/(\d+)/);
      break;
  }
  
  return match ? match[1] : 'Unknown';
}

/**
 * 评估设备性能级别
 */
function evaluatePerformanceLevel(deviceInfo: DeviceInfo): DevicePerformance {
  let score = 0;
  
  // CPU核心数评分（权重：30%）
  if (deviceInfo.cpuCores >= 8) score += 30;
  else if (deviceInfo.cpuCores >= 4) score += 20;
  else if (deviceInfo.cpuCores >= 2) score += 10;
  
  // 内存评分（权重：40%）
  const memoryGB = deviceInfo.availableMemory / (1024 * 1024 * 1024);
  if (memoryGB >= 8) score += 40;
  else if (memoryGB >= 4) score += 30;
  else if (memoryGB >= 2) score += 20;
  else score += 10;
  
  // 浏览器能力评分（权重：20%）
  if (deviceInfo.supportsWebCodecs) score += 8;
  if (deviceInfo.supportsOffscreenCanvas) score += 4;
  if (deviceInfo.supportsWebWorkers) score += 4;
  if (deviceInfo.supportsWasm) score += 4;
  
  // 网络速度评分（权重：10%）
  if (deviceInfo.networkSpeed === 'fast') score += 10;
  else if (deviceInfo.networkSpeed === 'medium') score += 5;
  
  // 根据总分确定性能级别
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * 从User Agent估算内存
 */
function estimateMemoryFromUserAgent(): number {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // 移动设备通常内存较少
  if (/mobile|android|iphone|ipad/.test(userAgent)) {
    return 2 * 1024 * 1024 * 1024; // 2GB
  }
  
  // 桌面设备默认估算
  return 4 * 1024 * 1024 * 1024; // 4GB
}

/**
 * 监听设备信息变化
 */
export function watchDeviceChanges(callback: (deviceInfo: DeviceInfo) => void): () => void {
  const updateDeviceInfo = async () => {
    const deviceInfo = await detectDeviceInfo();
    callback(deviceInfo);
  };

  // 监听网络状态变化
  const handleOnline = () => updateDeviceInfo();
  const handleOffline = () => updateDeviceInfo();
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // 监听内存变化（如果支持）
  let memoryInterval: NodeJS.Timeout | null = null;
  if ('memory' in performance) {
    memoryInterval = setInterval(updateDeviceInfo, 30000); // 每30秒检查一次
  }
  
  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (memoryInterval) {
      clearInterval(memoryInterval);
    }
  };
}

/**
 * 获取设备性能基准测试结果
 */
export async function runPerformanceBenchmark(): Promise<{
  cpuScore: number;
  memoryScore: number;
  renderScore: number;
  overallScore: number;
}> {
  const results = {
    cpuScore: 0,
    memoryScore: 0,
    renderScore: 0,
    overallScore: 0,
  };

  try {
    // CPU基准测试
    results.cpuScore = await benchmarkCPU();
    
    // 内存基准测试
    results.memoryScore = await benchmarkMemory();
    
    // 渲染基准测试
    results.renderScore = await benchmarkRendering();
    
    // 计算总分
    results.overallScore = (results.cpuScore + results.memoryScore + results.renderScore) / 3;
  } catch (error) {
    console.warn('Performance benchmark failed:', error);
  }

  return results;
}

/**
 * CPU基准测试
 */
async function benchmarkCPU(): Promise<number> {
  const startTime = performance.now();
  
  // 执行计算密集型任务
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }
  
  const duration = performance.now() - startTime;
  
  // 将时间转换为分数（越快分数越高）
  return Math.max(0, 100 - duration / 10);
}

/**
 * 内存基准测试
 */
async function benchmarkMemory(): Promise<number> {
  try {
    const arrays: number[][] = [];
    const startTime = performance.now();
    
    // 分配内存直到达到限制或超时
    while (performance.now() - startTime < 1000) { // 1秒超时
      arrays.push(new Array(10000).fill(0));
    }
    
    const allocatedMB = (arrays.length * 10000 * 8) / (1024 * 1024); // 8字节per number
    
    // 清理内存
    arrays.length = 0;
    
    return Math.min(100, allocatedMB / 10); // 每10MB得1分，最高100分
  } catch {
    return 50; // 默认分数
  }
}

/**
 * 渲染基准测试
 */
async function benchmarkRendering(): Promise<number> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve(50);
      return;
    }
    
    const startTime = performance.now();
    let frames = 0;
    
    function renderFrame() {
      // 绘制复杂图形
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < 100; i++) {
        ctx.beginPath();
        ctx.arc(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 50,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`;
        ctx.fill();
      }
      
      frames++;
      
      if (performance.now() - startTime < 1000) {
        requestAnimationFrame(renderFrame);
      } else {
        // 计算FPS并转换为分数
        const fps = frames;
        resolve(Math.min(100, fps * 2)); // 每FPS得2分，最高100分
      }
    }
    
    requestAnimationFrame(renderFrame);
  });
}
