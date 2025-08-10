// effects/video-effects.ts - 视频特效处理模块

import type { ExportConfig, ProgressCallback } from '../types/ffmpeg-types';

/**
 * 应用转场效果
 */
export const applyTransitionEffects = async (
  ffmpeg: any,
  videoFile: string,
  transitionElements: any[],
  exportConfig: ExportConfig,
  tempFiles: string[],
  onProgress?: ProgressCallback
): Promise<string> => {
  console.log(`🎬 Applying ${transitionElements.length} transition effects...`);
  
  if (transitionElements.length === 0) {
    return videoFile;
  }

  const outputName = `transition_applied_${Date.now()}.${exportConfig.format}`;
  tempFiles.push(outputName);

  try {
    // 构建转场滤镜
    const filters: string[] = [];
    
    console.log('🔍 Transition elements details:', transitionElements.map(t => ({
      id: t.id,
      type: t.transitionType,
      startTime: t.startTime,
      duration: t.duration,
      fromElementId: t.fromElementId,
      toElementId: t.toElementId
    })));
    
    for (const transition of transitionElements) {
      const { transitionType, startTime, duration, intensity = 0.5 } = transition;
      
      console.log(`🎬 Processing transition: ${transitionType} at ${startTime}s for ${duration}s`);
      
      switch (transitionType) {
        case 'fade':
          filters.push(`fade=t=in:st=${startTime}:d=${duration}`);
          filters.push(`fade=t=out:st=${startTime + duration - 0.5}:d=0.5`);
          break;
          
        case 'slide':
          const direction = transition.direction || 'left';
          const slideFilter = direction === 'left' 
            ? `slide=direction=left:duration=${duration}`
            : `slide=direction=right:duration=${duration}`;
          filters.push(slideFilter);
          break;
          
        case 'zoom':
          filters.push(`zoompan=z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.0015))':d=${Math.round(duration * 30)}`);
          break;
          
        case 'flash':
          // 闪黑/闪白转场：画面快速切至全黑/白并回到新画面的过渡效果
          const halfDuration = duration / 2;
          if (transition.direction === 'in') {
            // 闪黑转场
            filters.push(`fade=t=out:st=${startTime}:d=${halfDuration}:color=black`);
            filters.push(`fade=t=in:st=${startTime + halfDuration}:d=${halfDuration}:color=black`);
          } else {
            // 闪白转场
            filters.push(`fade=t=out:st=${startTime}:d=${halfDuration}:color=white`);
            filters.push(`fade=t=in:st=${startTime + halfDuration}:d=${halfDuration}:color=white`);
          }
          break;
          
        case 'dissolve':
          // 叠化转场：两个画面整体透明度平滑渐变的溶解效果
          // 使用更平滑的淡入淡出实现叠化效果
          filters.push(`fade=t=in:st=${startTime}:d=${duration}:alpha=1`);
          filters.push(`fade=t=out:st=${startTime}:d=${duration}:alpha=1`);
          break;
          
        default:
          console.warn(`Unknown transition type: ${transitionType}, using fade as fallback`);
          // 使用fade作为默认转场效果
          filters.push(`fade=t=in:st=${startTime}:d=${duration}`);
          filters.push(`fade=t=out:st=${startTime + duration - 0.5}:d=0.5`);
      }
    }

    if (filters.length === 0) {
      return videoFile;
    }

    // 构建FFmpeg命令
    const command = [
      '-i', videoFile,
      '-vf', filters.join(','),
      '-c:a', 'copy',
      '-y', outputName
    ];

    console.log('🎬 Executing transition command:', command.join(' '));
    await ffmpeg.exec(command);
    
    // 检查输出文件是否存在且有内容
    try {
      const outputData = await ffmpeg.readFile(outputName);
      if (outputData.length === 0) {
        console.warn('⚠️ Transition output file is empty, returning original file');
        return videoFile;
      }
      console.log(`✅ Transition effects applied, output size: ${outputData.length} bytes`);
    } catch (readError) {
      console.warn('⚠️ Failed to read transition output, returning original file');
      return videoFile;
    }
    
    onProgress?.(60);
    return outputName;

  } catch (error) {
    console.error('❌ Transition effects failed:', error);
    console.log('🔄 Returning original video file due to transition failure');
    // 转场失败时返回原始文件，而不是抛出错误
    return videoFile;
  }
};

/**
 * 应用镜像效果
 */
export const applyMirrorEffects = async (
  ffmpeg: any,
  inputFile: string,
  element: any,
  exportConfig: ExportConfig,
  tempFiles: string[],
  onProgress?: ProgressCallback
): Promise<string> => {
  console.log('🪞 Applying mirror effects...');

  const outputName = `mirror_applied_${Date.now()}.${exportConfig.format}`;
  tempFiles.push(outputName);

  try {
    const filters: string[] = [];

    // 水平翻转
    if (element.horizontalFlip) {
      filters.push('hflip');
    }

    // 垂直翻转
    if (element.verticalFlip) {
      filters.push('vflip');
    }

    // 旋转
    if (element.rotation) {
      const radians = (element.rotation * Math.PI) / 180;
      filters.push(`rotate=${radians}`);
    }

    if (filters.length === 0) {
      return inputFile;
    }

    const command = [
      '-i', inputFile,
      '-vf', filters.join(','),
      '-c:a', 'copy',
      '-y', outputName
    ];

    console.log('🪞 Executing mirror command:', command);
    await ffmpeg.exec(command);
    
    onProgress?.(70);
    console.log('✅ Mirror effects applied');
    return outputName;

  } catch (error) {
    console.error('❌ Mirror effects failed:', error);
    throw new Error(`Mirror effects failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 应用蒙板效果
 */
export const applyMaskEffects = async (
  ffmpeg: any,
  inputFile: string,
  masks: any[],
  exportConfig: ExportConfig,
  tempFiles: string[],
  onProgress?: ProgressCallback
): Promise<string> => {
  console.log(`🎭 Applying ${masks.length} mask effects...`);

  if (!masks || masks.length === 0) {
    return inputFile;
  }

  const outputName = `mask_applied_${Date.now()}.${exportConfig.format}`;
  tempFiles.push(outputName);

  try {
    // 构建蒙板滤镜
    const filters: string[] = [];
    
    for (const mask of masks) {
      const { type, x, y, width, height, blur = 0 } = mask;
      
      if (type === 'rectangle') {
        // 矩形蒙板
        const cropFilter = `crop=${width}:${height}:${x}:${y}`;
        filters.push(cropFilter);
        
        if (blur > 0) {
          filters.push(`gblur=sigma=${blur}`);
        }
      } else if (type === 'circle') {
        // 圆形蒙板 - 使用复杂的滤镜
        const radius = Math.min(width, height) / 2;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        const circleFilter = `geq=r='if(lt(sqrt((X-${centerX})^2+(Y-${centerY})^2),${radius}),r(X,Y),0)':g='if(lt(sqrt((X-${centerX})^2+(Y-${centerY})^2),${radius}),g(X,Y),0)':b='if(lt(sqrt((X-${centerX})^2+(Y-${centerY})^2),${radius}),b(X,Y),0)'`;
        filters.push(circleFilter);
        
        if (blur > 0) {
          filters.push(`gblur=sigma=${blur}`);
        }
      }
    }

    if (filters.length === 0) {
      return inputFile;
    }

    const command = [
      '-i', inputFile,
      '-vf', filters.join(','),
      '-c:a', 'copy',
      '-y', outputName
    ];

    console.log('🎭 Executing mask command:', command.join(' '));
    await ffmpeg.exec(command);
    
    // 检查输出文件是否存在且有内容
    try {
      const outputData = await ffmpeg.readFile(outputName);
      if (outputData.length === 0) {
        console.warn('⚠️ Mask output file is empty, returning original file');
        return inputFile;
      }
      console.log(`✅ Mask effects applied, output size: ${outputData.length} bytes`);
    } catch (readError) {
      console.warn('⚠️ Failed to read mask output, returning original file');
      return inputFile;
    }
    
    onProgress?.(75);
    return outputName;

  } catch (error) {
    console.error('❌ Mask effects failed:', error);
    console.log('🔄 Returning original video file due to mask failure');
    // 蒙版失败时返回原始文件，而不是抛出错误
    return inputFile;
  }
};

/**
 * 渲染字幕到视频
 */
export const renderSubtitlesToVideo = async (
  ffmpeg: any,
  videoFile: string,
  textElements: any[],
  exportConfig: ExportConfig,
  tempFiles: string[],
  onProgress?: ProgressCallback
): Promise<string> => {
  console.log(`📝 Rendering ${textElements.length} subtitle elements...`);

  if (textElements.length === 0) {
    return videoFile;
  }

  const outputName = `subtitles_rendered_${Date.now()}.${exportConfig.format}`;
  tempFiles.push(outputName);

  try {
    // 构建字幕滤镜
    const drawTextFilters: string[] = [];

    for (const textElement of textElements) {
      const {
        content = '',
        fontSize = 24,
        fontFamily = 'Arial',
        color = 'white',
        backgroundColor = 'black@0.5',
        x = 50,
        y = 50,
        startTime = 0,
        duration = 5,
        opacity = 1
      } = textElement;

      // 安全的文本转义 - 移除所有可能导致问题的字符
      const escapedText = content
        .replace(/[\\:'"=,;]/g, '')  // 移除所有可能的问题字符
        .replace(/[^\w\s\-.,!?]/g, '') // 只保留安全字符
        .trim();

      if (!escapedText) {
        console.log(`📝 Skipping empty text element ${textElement.id || 'unknown'}`);
        continue;
      }

      // 构建简化的drawtext滤镜 - 不使用字体文件和单引号
      const drawTextFilter = `drawtext=text=${escapedText}:fontsize=${fontSize}:fontcolor=${color}:x=${x}:y=${y}:enable='between(t,${startTime},${startTime + duration})'`;

      // 添加到滤镜列表（简化处理，暂时不支持背景色）
      drawTextFilters.push(drawTextFilter);
    }

    if (drawTextFilters.length === 0) {
      return videoFile;
    }

    // 构建FFmpeg命令
    const command = [
      '-i', videoFile,
      '-vf', drawTextFilters.join(','),
      '-c:a', 'copy',
      '-y', outputName
    ];

    console.log('📝 Executing subtitle rendering command...');
    await ffmpeg.exec(command);
    
    onProgress?.(85);
    console.log('✅ Subtitles rendered');
    return outputName;

  } catch (error) {
    console.error('❌ Subtitle rendering failed:', error);
    
    // 如果字体文件问题，尝试使用内置字体
    console.log('🔄 Retrying with built-in font...');
    try {
      const fallbackFilters = textElements.map(textElement => {
        const {
          content = '',
          fontSize = 24,
          color = 'white',
          x = 50,
          y = 50,
          startTime = 0,
          duration = 5
        } = textElement;

        const escapedText = content
          .replace(/'/g, "\\'")
          .replace(/:/g, "\\:")
          .replace(/\[/g, "\\[")
          .replace(/\]/g, "\\]")
          .replace(/,/g, "\\,");

        return [
          `drawtext=text='${escapedText}'`,
          `fontsize=${fontSize}`,
          `fontcolor=${color}`,
          `x=${x}`,
          `y=${y}`,
          `enable='between(t,${startTime},${startTime + duration})'`
        ].join(':');
      });

      const fallbackCommand = [
        '-i', videoFile,
        '-vf', fallbackFilters.join(','),
        '-c:a', 'copy',
        '-y', outputName
      ];

      await ffmpeg.exec(fallbackCommand);
      console.log('✅ Subtitles rendered with fallback font');
      return outputName;
      
    } catch (fallbackError) {
      console.error('❌ Fallback subtitle rendering also failed:', fallbackError);
      console.log('📝 Returning original video without subtitles');
      return videoFile;
    }
  }
}; 