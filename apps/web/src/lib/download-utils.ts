/**
 * 下载工具函数
 * 提供统一的文件下载行为，确保直接下载而不是打开保存对话框
 */

export interface DownloadOptions {
  /** 文件名 */
  filename?: string;
  /** 是否在下载后自动释放blob URL */
  autoRevoke?: boolean;
  /** 自动释放的延迟时间（毫秒） */
  revokeDelay?: number;
  /** 是否使用备用下载方案 */
  useFallback?: boolean;
}

/**
 * 强制下载文件，不打开保存对话框
 * @param url 文件URL（可以是blob URL或普通URL）
 * @param options 下载选项
 */
export function forceDownload(url: string, options: DownloadOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const {
      filename = 'download',
      autoRevoke = true,
      revokeDelay = 1000,
      useFallback = true
    } = options;

    try {
      // 方法1：使用隐藏的a标签强制下载
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      a.style.position = 'absolute';
      a.style.left = '-9999px';
      
      // 添加到DOM
      document.body.appendChild(a);
      
      // 触发下载
      a.click();
      
      // 立即移除元素
      document.body.removeChild(a);
      
      // 自动释放blob URL
      if (autoRevoke && url.startsWith('blob:')) {
        setTimeout(() => {
          try {
            URL.revokeObjectURL(url);
            console.log('✅ Blob URL revoked:', url);
          } catch (error) {
            console.warn('⚠️ Failed to revoke blob URL:', error);
          }
        }, revokeDelay);
      }
      
      console.log('✅ Force download triggered successfully:', filename);
      resolve(true);
      
    } catch (error) {
      console.error('❌ Force download failed:', error);
      
      if (useFallback) {
        // 备用方案1：尝试直接打开URL
        try {
          const newWindow = window.open(url, '_blank');
          if (newWindow) {
            console.log('✅ Fallback download via window.open');
            resolve(true);
          } else {
            throw new Error('Window.open blocked');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback download also failed:', fallbackError);
          
          // 备用方案2：尝试使用location.href
          try {
            window.location.href = url;
            console.log('✅ Fallback download via location.href');
            resolve(true);
          } catch (locationError) {
            console.error('❌ All download methods failed:', locationError);
            resolve(false);
          }
        }
      } else {
        resolve(false);
      }
    }
  });
}

/**
 * 从Blob创建下载
 * @param blob Blob对象
 * @param filename 文件名
 * @param options 下载选项
 */
export async function downloadBlob(
  blob: Blob, 
  filename: string, 
  options: Omit<DownloadOptions, 'autoRevoke'> = {}
): Promise<boolean> {
  try {
    const url = URL.createObjectURL(blob);
    const success = await forceDownload(url, {
      ...options,
      filename,
      autoRevoke: true, // Blob URL总是需要释放
    });
    
    if (!success) {
      // 如果下载失败，立即释放URL
      URL.revokeObjectURL(url);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Download blob failed:', error);
    return false;
  }
}

/**
 * 检查浏览器下载支持
 */
export function checkDownloadSupport(): {
  download: boolean;
  blob: boolean;
  objectURL: boolean;
} {
  const a = document.createElement('a');
  
  return {
    download: 'download' in a,
    blob: typeof Blob !== 'undefined',
    objectURL: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function',
  };
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(lastDot) : '';
}

/**
 * 确保文件名有正确的扩展名
 */
export function ensureFileExtension(filename: string, defaultExtension: string): string {
  const currentExt = getFileExtension(filename);
  if (!currentExt) {
    return filename + (defaultExtension.startsWith('.') ? defaultExtension : '.' + defaultExtension);
  }
  return filename;
}

/**
 * 生成带时间戳的文件名
 */
export function generateTimestampedFilename(baseName: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const cleanBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const cleanExtension = extension.startsWith('.') ? extension : '.' + extension;
  return `${cleanBaseName}_${timestamp}${cleanExtension}`;
}

/**
 * 导出结果下载工具
 */
export async function downloadExportResult(
  url: string,
  filename?: string,
  size?: number
): Promise<boolean> {
  const finalFilename = filename || generateTimestampedFilename('export', 'mp4');
  
  console.log('🔽 Starting export result download:', {
    url,
    filename: finalFilename,
    size: size ? `${(size / 1024 / 1024).toFixed(1)}MB` : 'unknown'
  });
  
  const success = await forceDownload(url, {
    filename: finalFilename,
    autoRevoke: url.startsWith('blob:'),
    revokeDelay: 2000, // 给下载更多时间
    useFallback: true,
  });
  
  if (success) {
    console.log('✅ Export result download completed');
  } else {
    console.error('❌ Export result download failed');
  }
  
  return success;
}
