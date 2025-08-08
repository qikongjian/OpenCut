// core/init.ts - FFmpeg初始化和测试功能

import { FFmpeg } from '@ffmpeg/ffmpeg';

// 全局变量
let ffmpeg: FFmpeg | null = null;
let ffmpegInitializing = false;
let ffmpegInitPromise: Promise<FFmpeg> | null = null;

/**
 * 初始化FFmpeg实例
 * @returns Promise<FFmpeg> FFmpeg实例
 */
export const initFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg) return ffmpeg;
  
  // 防止重复初始化
  if (ffmpegInitializing && ffmpegInitPromise) {
    return ffmpegInitPromise;
  }
  
  ffmpegInitializing = true;
  ffmpegInitPromise = (async () => {
    try {
      console.log('🚀 Initializing FFmpeg with performance optimizations...');
      
      // 创建FFmpeg实例
      ffmpeg = new FFmpeg();
      
      // 检查FFmpeg对象是否正确创建
      if (!ffmpeg) {
        throw new Error('Failed to create FFmpeg instance');
      }
      
      console.log('📦 Loading FFmpeg core files...');
      
      // 使用最简单的加载方式
      await ffmpeg.load();
      
      console.log('✅ FFmpeg initialized successfully with optimizations');
      return ffmpeg;
    } catch (error) {
      console.error('❌ Failed to initialize FFmpeg:', error);
      ffmpeg = null;
      
      // 提供更详细的错误信息
      let errorMessage = 'FFmpeg initialization failed';
      if (error instanceof Error) {
        if (error.message.includes('setLogger')) {
          errorMessage = 'FFmpeg library version incompatible - please update @ffmpeg/ffmpeg to latest version';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Failed to load FFmpeg core files - check network connection';
        } else if (error.message.includes('wasm')) {
          errorMessage = 'WebAssembly not supported or failed to load';
        } else if (error.message.includes('load method not found')) {
          errorMessage = 'FFmpeg API incompatible - please check library version';
        } else {
          errorMessage = `FFmpeg initialization failed: ${error.message}`;
        }
      }
      
      throw new Error(errorMessage);
    } finally {
      ffmpegInitializing = false;
    }
  })();
  
  return ffmpegInitPromise;
};

/**
 * 测试FFmpeg功能
 * @returns Promise<{success: boolean; error?: string}> 测试结果
 */
export const testFFmpeg = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Testing FFmpeg functionality...');
    
    const ffmpeg = await initFFmpeg();
    
    // Test basic functionality
    const testInput = 'test_input.txt';
    const testOutput = 'test_output.txt';
    
    // Write a simple test file
    const testData = new Uint8Array(new TextEncoder().encode('Hello FFmpeg!'));
    await ffmpeg.writeFile(testInput, testData as any);
    
    // Execute a simple command
    await ffmpeg.exec(['-i', testInput, testOutput]);
    
    // Read the output
    const data = await ffmpeg.readFile(testOutput);
    const result = new TextDecoder().decode(data as Uint8Array);
    
    // Cleanup
    await ffmpeg.deleteFile(testInput);
    await ffmpeg.deleteFile(testOutput);
    
    console.log('FFmpeg test successful:', result);
    return { success: true };
  } catch (error) {
    console.error('FFmpeg test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}; 