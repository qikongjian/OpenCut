// ffmpeg-manager.ts - FFmpeg.wasm 管理器
// 此文件负责管理FFmpeg.wasm实例和基础操作
// 文件路径: lib/export/ffmpeg-manager.ts

// 使用动态导入避免模块解析问题
// import { FFmpeg } from '@ffmpeg/ffmpeg';
// import { fetchFile, toBlobURL } from '@ffmpeg/util';

/**
 * FFmpeg管理器 - 单例模式
 */
export class FFmpegManager {
  private static instance: FFmpegManager;
  private ffmpeg: any | null = null; // 使用any类型避免静态导入
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): FFmpegManager {
    if (!FFmpegManager.instance) {
      FFmpegManager.instance = new FFmpegManager();
    }
    return FFmpegManager.instance;
  }

  /**
   * 初始化FFmpeg
   */
  async initialize(): Promise<void> {
    if (this.isLoaded) return;
    if (this.isLoading && this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    this.loadPromise = this._loadFFmpeg();
    
    try {
      await this.loadPromise;
      this.isLoaded = true;
    } catch (error) {
      this.isLoading = false;
      this.loadPromise = null;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 加载FFmpeg
   */
  private async _loadFFmpeg(): Promise<void> {
    try {
      // 动态导入FFmpeg模块
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');

      this.ffmpeg = new FFmpeg();

      // 设置日志回调
      this.ffmpeg.on('log', ({ message }: any) => {
        console.log('[FFmpeg]', message);
      });

      // 加载FFmpeg核心文件
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error(`FFmpeg加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取FFmpeg实例
   */
  getFFmpeg(): any {
    if (!this.ffmpeg || !this.isLoaded) {
      throw new Error('FFmpeg not initialized. Call initialize() first.');
    }
    return this.ffmpeg;
  }

  /**
   * 检查是否已加载
   */
  isReady(): boolean {
    return this.isLoaded && this.ffmpeg !== null;
  }

  /**
   * 写入文件到FFmpeg文件系统
   */
  async writeFile(filename: string, data: File | Blob | Uint8Array): Promise<void> {
    const ffmpeg = this.getFFmpeg();

    if (data instanceof File || data instanceof Blob) {
      // 动态导入fetchFile工具
      const { fetchFile } = await import('@ffmpeg/util');
      const fileData = await fetchFile(data);
      await ffmpeg.writeFile(filename, fileData);
    } else {
      await ffmpeg.writeFile(filename, data);
    }
  }

  /**
   * 从FFmpeg文件系统读取文件
   */
  async readFile(filename: string): Promise<Uint8Array> {
    const ffmpeg = this.getFFmpeg();
    return await ffmpeg.readFile(filename) as Uint8Array;
  }

  /**
   * 删除文件
   */
  async deleteFile(filename: string): Promise<void> {
    const ffmpeg = this.getFFmpeg();
    try {
      await ffmpeg.deleteFile(filename);
    } catch (error) {
      // 文件可能不存在，忽略错误
      console.warn(`Failed to delete file ${filename}:`, error);
    }
  }

  /**
   * 列出文件系统中的文件
   */
  async listFiles(): Promise<string[]> {
    const ffmpeg = this.getFFmpeg();
    try {
      return await ffmpeg.listDir('/');
    } catch (error) {
      console.warn('Failed to list files:', error);
      return [];
    }
  }

  /**
   * 清理文件系统
   */
  async cleanup(): Promise<void> {
    if (!this.isReady()) return;

    try {
      const files = await this.listFiles();
      for (const file of files) {
        await this.deleteFile(file);
      }
    } catch (error) {
      console.warn('Failed to cleanup files:', error);
    }
  }

  /**
   * 执行FFmpeg命令
   */
  async exec(args: string[]): Promise<void> {
    const ffmpeg = this.getFFmpeg();
    await ffmpeg.exec(args);
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filename: string): Promise<MediaInfo | null> {
    try {
      const ffmpeg = this.getFFmpeg();
      
      // 使用ffprobe获取媒体信息
      await ffmpeg.exec([
        '-i', filename,
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        'info.json'
      ]);

      const infoData = await ffmpeg.readFile('info.json');
      const infoText = new TextDecoder().decode(infoData);
      const info = JSON.parse(infoText);

      await this.deleteFile('info.json');

      return this.parseMediaInfo(info);
    } catch (error) {
      console.warn(`Failed to get file info for ${filename}:`, error);
      return null;
    }
  }

  /**
   * 解析媒体信息
   */
  private parseMediaInfo(info: any): MediaInfo {
    const videoStream = info.streams?.find((s: any) => s.codec_type === 'video');
    const audioStream = info.streams?.find((s: any) => s.codec_type === 'audio');

    return {
      duration: parseFloat(info.format?.duration || '0'),
      size: parseInt(info.format?.size || '0'),
      bitrate: parseInt(info.format?.bit_rate || '0'),
      video: videoStream ? {
        codec: videoStream.codec_name,
        width: videoStream.width,
        height: videoStream.height,
        fps: this.parseFPS(videoStream.r_frame_rate),
        bitrate: parseInt(videoStream.bit_rate || '0'),
      } : undefined,
      audio: audioStream ? {
        codec: audioStream.codec_name,
        sampleRate: parseInt(audioStream.sample_rate || '0'),
        channels: audioStream.channels,
        bitrate: parseInt(audioStream.bit_rate || '0'),
      } : undefined,
    };
  }

  /**
   * 解析帧率
   */
  private parseFPS(frameRate: string): number {
    if (!frameRate) return 0;
    
    const parts = frameRate.split('/');
    if (parts.length === 2) {
      const numerator = parseInt(parts[0]);
      const denominator = parseInt(parts[1]);
      return denominator > 0 ? numerator / denominator : 0;
    }
    
    return parseFloat(frameRate);
  }

  /**
   * 创建进度监听器
   */
  createProgressListener(
    totalDuration: number,
    onProgress: (progress: number) => void
  ): (message: string) => void {
    return (message: string) => {
      // 解析FFmpeg输出中的时间信息
      const timeMatch = message.match(/time=(\d+):(\d+):(\d+)\.(\d+)/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseInt(timeMatch[3]);
        const milliseconds = parseInt(timeMatch[4]) * 10; // centiseconds to milliseconds
        
        const currentTime = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
        const progress = totalDuration > 0 ? Math.min(currentTime / totalDuration, 1) : 0;
        
        onProgress(progress);
      }
    };
  }

  /**
   * 估算内存使用
   */
  estimateMemoryUsage(width: number, height: number, duration: number): number {
    // 估算公式：分辨率 × 帧数 × 每像素字节数
    const fps = 30; // 假设30fps
    const bytesPerPixel = 4; // RGBA
    const frames = duration * fps;
    
    return width * height * frames * bytesPerPixel;
  }

  /**
   * 检查内存限制
   */
  checkMemoryLimit(estimatedUsage: number): boolean {
    // 浏览器通常限制在2GB左右
    const memoryLimit = 2 * 1024 * 1024 * 1024; // 2GB
    return estimatedUsage < memoryLimit * 0.8; // 使用80%作为安全阈值
  }
}

// 类型定义
export interface MediaInfo {
  duration: number;
  size: number;
  bitrate: number;
  video?: {
    codec: string;
    width: number;
    height: number;
    fps: number;
    bitrate: number;
  };
  audio?: {
    codec: string;
    sampleRate: number;
    channels: number;
    bitrate: number;
  };
}

// 导出单例实例
export const ffmpegManager = FFmpegManager.getInstance();

/**
 * FFmpeg命令构建器
 */
export class FFmpegCommandBuilder {
  private args: string[] = [];

  /**
   * 添加输入文件
   */
  input(filename: string): this {
    this.args.push('-i', filename);
    return this;
  }

  /**
   * 设置视频编码器
   */
  videoCodec(codec: string): this {
    this.args.push('-c:v', codec);
    return this;
  }

  /**
   * 设置音频编码器
   */
  audioCodec(codec: string): this {
    this.args.push('-c:a', codec);
    return this;
  }

  /**
   * 设置视频码率
   */
  videoBitrate(bitrate: string): this {
    this.args.push('-b:v', bitrate);
    return this;
  }

  /**
   * 设置音频码率
   */
  audioBitrate(bitrate: string): this {
    this.args.push('-b:a', bitrate);
    return this;
  }

  /**
   * 设置帧率
   */
  fps(fps: number): this {
    this.args.push('-r', fps.toString());
    return this;
  }

  /**
   * 设置分辨率
   */
  resolution(width: number, height: number): this {
    this.args.push('-s', `${width}x${height}`);
    return this;
  }

  /**
   * 设置CRF质量
   */
  crf(value: number): this {
    this.args.push('-crf', value.toString());
    return this;
  }

  /**
   * 设置预设
   */
  preset(preset: string): this {
    this.args.push('-preset', preset);
    return this;
  }

  /**
   * 设置像素格式
   */
  pixelFormat(format: string): this {
    this.args.push('-pix_fmt', format);
    return this;
  }

  /**
   * 添加滤镜
   */
  filter(filterString: string): this {
    this.args.push('-vf', filterString);
    return this;
  }

  /**
   * 添加复杂滤镜
   */
  complexFilter(filterString: string): this {
    this.args.push('-filter_complex', filterString);
    return this;
  }

  /**
   * 设置时间范围
   */
  timeRange(start: number, duration: number): this {
    this.args.push('-ss', start.toString(), '-t', duration.toString());
    return this;
  }

  /**
   * 覆盖输出文件
   */
  overwrite(): this {
    this.args.push('-y');
    return this;
  }

  /**
   * 设置输出文件
   */
  output(filename: string): this {
    this.args.push(filename);
    return this;
  }

  /**
   * 添加自定义参数
   */
  custom(...args: string[]): this {
    this.args.push(...args);
    return this;
  }

  /**
   * 构建命令参数
   */
  build(): string[] {
    return [...this.args];
  }

  /**
   * 重置构建器
   */
  reset(): this {
    this.args = [];
    return this;
  }
}
