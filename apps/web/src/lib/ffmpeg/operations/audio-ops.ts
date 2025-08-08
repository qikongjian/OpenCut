// operations/audio-ops.ts - 音频处理操作

import type { ExportConfig, ProgressCallback } from '../types/ffmpeg-types';

/**
 * 处理音频轨道
 */
export const processAudioTracks = async (
  ffmpeg: any,
  videoFile: string,
  audioElements: any[],
  exportConfig: ExportConfig,
  tempFiles: string[],
  onProgress?: ProgressCallback
): Promise<string> => {
  console.log(`🎵 Processing ${audioElements.length} audio tracks...`);

  if (audioElements.length === 0) {
    return videoFile;
  }

  const outputName = `audio_mixed_${Date.now()}.${exportConfig.format}`;
  tempFiles.push(outputName);

  try {
    // 准备音频文件
    const audioInputs: string[] = [];
    const audioFilters: string[] = [];

    for (let i = 0; i < audioElements.length; i++) {
      const element = audioElements[i];
      const audioInputName = `audio_input_${i}_${Date.now()}.mp3`;
      
      console.log(`🎵 Processing audio element ${i + 1}/${audioElements.length}: ${element.id}`);

      // 获取音频文件
      let audioFile: File;
      if (element.mediaFile) {
        audioFile = element.mediaFile;
      } else if (element.mediaUrl) {
        const response = await fetch(element.mediaUrl);
        const blob = await response.blob();
        audioFile = new File([blob], 'audio.mp3', { type: blob.type });
      } else {
        // 从媒体库获取
        const mediaStore = await import('@/stores/media-store').then(m => m.useMediaStore.getState());
        const mediaItem = mediaStore.mediaItems.find(item => item.id === element.mediaId);
        
        if (!mediaItem || !mediaItem.file) {
          console.warn(`⚠️ Audio file not found for element ${element.id}, skipping`);
          continue;
        }
        audioFile = mediaItem.file;
      }

      // 写入音频文件
      await ffmpeg.writeFile(audioInputName, new Uint8Array(await audioFile.arrayBuffer()));
      tempFiles.push(audioInputName);
      audioInputs.push(audioInputName);

      // 创建音频滤镜
      const delay = element.startTime || 0;
      const volume = element.volume || 1.0;
      
      // 添加延迟和音量调节
      audioFilters.push(`[${i + 1}:a]adelay=${Math.round(delay * 1000)}|${Math.round(delay * 1000)},volume=${volume}[a${i}]`);
    }

    if (audioInputs.length === 0) {
      console.log('⚠️ No valid audio files found, returning original video');
      return videoFile;
    }

    // 构建FFmpeg命令
    const command = [
      '-i', videoFile,
      ...audioInputs.flatMap(input => ['-i', input])
    ];

    // 添加复杂滤镜
    if (audioFilters.length > 0) {
      const mixFilter = audioFilters.length === 1 
        ? `${audioFilters[0]};[0:a][a0]amix=inputs=2:duration=longest[aout]`
        : `${audioFilters.join(';')};[0:a]${audioInputs.map((_, i) => `[a${i}]`).join('')}amix=inputs=${audioInputs.length + 1}:duration=longest[aout]`;
      
      command.push(
        '-filter_complex', mixFilter,
        '-map', '0:v',
        '-map', '[aout]',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-y', outputName
      );
    } else {
      // 简单复制
      command.push(
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-y', outputName
      );
    }

    console.log('🎵 Executing audio mixing command...');
    await ffmpeg.exec(command);

    onProgress?.(80);
    console.log('✅ Audio processing completed');
    return outputName;

  } catch (error) {
    console.error('❌ Audio processing failed:', error);
    throw new Error(`Audio processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 