/**
 * File构造函数兼容性工具
 * 解决生产环境中File构造函数未定义的问题
 */

/**
 * 检查File构造函数是否可用
 */
export function isFileConstructorAvailable(): boolean {
  try {
    return typeof File !== 'undefined' && 
           File.prototype && 
           File.prototype.constructor === File;
  } catch {
    return false;
  }
}

/**
 * 创建File对象的兼容性函数
 * 在File构造函数不可用时使用Blob polyfill
 */
export function createFile(
  fileBits: BlobPart[],
  fileName: string,
  options: FilePropertyBag = {}
): File {
  try {
    // 尝试使用原生File构造函数
    if (isFileConstructorAvailable()) {
      return new File(fileBits, fileName, options);
    }
  } catch (error) {
    console.warn('⚠️ File constructor failed, using polyfill:', error);
  }

  // Polyfill: 使用Blob并添加File属性
  const blob = new Blob(fileBits, { type: options.type });
  return Object.assign(blob, {
    name: fileName,
    lastModified: options.lastModified || Date.now(),
    webkitRelativePath: '',
    type: options.type || '',
  }) as File;
}

/**
 * 从Blob创建File对象的兼容性函数
 */
export function createFileFromBlob(
  blob: Blob,
  fileName: string,
  options: Partial<FilePropertyBag> = {}
): File {
  try {
    // 尝试使用原生File构造函数
    if (isFileConstructorAvailable()) {
      return new File([blob], fileName, {
        type: options.type || blob.type,
        lastModified: options.lastModified || Date.now(),
      });
    }
  } catch (error) {
    console.warn('⚠️ File constructor failed, using polyfill:', error);
  }

  // Polyfill: 直接扩展Blob对象
  return Object.assign(blob, {
    name: fileName,
    lastModified: options.lastModified || Date.now(),
    webkitRelativePath: '',
    type: options.type || blob.type,
  }) as File;
}

/**
 * 环境兼容性检查
 */
export function checkBrowserCompatibility(): {
  fileConstructor: boolean;
  blob: boolean;
  urlCreateObjectURL: boolean;
  fetch: boolean;
} {
  return {
    fileConstructor: isFileConstructorAvailable(),
    blob: typeof Blob !== 'undefined',
    urlCreateObjectURL: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function',
    fetch: typeof fetch === 'function',
  };
}

/**
 * 初始化兼容性检查并记录警告
 */
export function initFilePolyfill(): void {
  const compatibility = checkBrowserCompatibility();
  
  if (!compatibility.fileConstructor) {
    console.warn('⚠️ File constructor not available, using polyfill');
  }
  
  if (!compatibility.blob) {
    console.error('❌ Blob not available - this may cause serious issues');
  }
  
  if (!compatibility.urlCreateObjectURL) {
    console.error('❌ URL.createObjectURL not available - this may cause serious issues');
  }
  
  if (!compatibility.fetch) {
    console.error('❌ fetch not available - this may cause serious issues');
  }
  
  console.log('🔧 File polyfill initialized:', compatibility);
}
