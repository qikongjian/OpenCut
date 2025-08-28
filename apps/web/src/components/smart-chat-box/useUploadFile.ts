import { useState, useCallback } from "react";

// 完全复制video-flow的上传token获取函数
const getUploadToken = async (timeoutMs: number = 10000): Promise<{ token: string, domain: string }> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.log(`请求超时（${timeoutMs / 1000}秒），正在中断请求...`)
    controller.abort()
  }, timeoutMs)

  try {
    const token = localStorage?.getItem('token') || 'mock-token';
    const response = await fetch(`${process.env.NEXT_PUBLIC_SMART_API || 'https://77.smartvideo.py.qikongjian.com'}/common/get-upload-token`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
      mode: "cors",
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("获取token响应错误:", response.status, errorText)
      throw new Error(`获取token失败: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log("获取token响应:", result)

    if (result.code === 0 && result.data) {
      return {
        token: result.data.token || result.data,
        domain: result.data.domain || 'cdn.qikongjian.com'
      }
    } else {
      throw new Error(result.message || "获取token失败")
    }
  } catch (error) {
    clearTimeout(timeoutId)
    console.error("获取上传token失败:", error)
    throw error
  }
}

// 完全复制video-flow的文件名生成函数
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split(".").pop()
  return `videos/${timestamp}_${randomStr}.${extension}`
}

// 完全复制video-flow的七牛云上传函数
const uploadToQiniu = async (
  file: File, 
  token: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const uniqueFileName = generateUniqueFileName(file.name)

  const formData = new FormData()
  formData.append("token", token)
  formData.append("key", uniqueFileName)
  formData.append("file", file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          const qiniuUrl = `https://cdn.qikongjian.com/${response.key || uniqueFileName}`
          console.log("七牛云上传成功:", response)
          resolve(qiniuUrl)
        } catch (error) {
          console.error("解析响应失败:", error, "原始响应:", xhr.responseText)
          reject(new Error(`解析上传响应失败: ${xhr.responseText}`))
        }
      } else {
        console.error("七牛云上传失败:", xhr.status, xhr.statusText, xhr.responseText)
        reject(new Error(`上传失败: ${xhr.status} ${xhr.statusText}`))
      }
    })

    xhr.addEventListener("error", (e) => {
      console.error("上传网络错误:", e)
      reject(new Error("网络错误，上传失败"))
    })

    xhr.addEventListener("abort", () => {
      reject(new Error("上传被取消"))
    })

    xhr.open("POST", "https://up-z2.qiniup.com")
    xhr.send(formData)
  })
}

/**
 * 用于上传文件到七牛云的自定义 Hook - 完全复制video-flow版本
 * @returns {object} - 包含上传函数和加载状态
 */
export function useUploadFile() {
  /** 加载状态 */
  const [isUploading, setIsUploading] = useState(false);

  /**
   * 上传文件到七牛云 - 完全复制video-flow版本
   * @param {File} file - 要上传的文件
   * @param {(progress: number) => void} [onProgress] - 上传进度回调
   * @returns {Promise<string>} - 上传后文件的 URL
   * @throws {Error} - 上传失败时抛出异常
   */
  const uploadFile = useCallback(
    async (
      file: File,
      onProgress?: (progress: number) => void
    ): Promise<string> => {
      try {
        setIsUploading(true);
        const { token } = await getUploadToken();
        const fileUrl = await uploadToQiniu(file, token, onProgress);
        return fileUrl;
      } catch (err) {
        console.error("文件上传失败:", err);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return { uploadFile, isUploading };
}
