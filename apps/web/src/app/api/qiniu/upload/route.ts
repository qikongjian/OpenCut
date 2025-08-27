// qiniu/upload/route.ts - 七牛云上传API
// 此文件提供七牛云文件上传服务
// 文件路径: app/api/qiniu/upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawn } from "child_process";

// 七牛云配置（硬编码）
const QINIU_CONFIG = {
  accessKey: 'Ef8cxF6Hg01m6wuLpMpUgICXcztrdsXKTJzjeoro',
  secretKey: '-VcHBrdszBch8hBKXw4itiF-dpCIcAc91LCb_pn3',
  bucketName: 'risingfalling',
  domain: 'cdn.qikongjian.com',
};

/**
 * 七牛云上传API - POST请求
 */
export async function POST(request: NextRequest) {
  console.log('📥 七牛云上传API收到请求');
  
  try {
    // 输出配置信息（脱敏）
    console.log('🔧 七牛云配置:');
    console.log('  - Access Key:', `${QINIU_CONFIG.accessKey.substring(0, 8)}...`);
    console.log('  - Secret Key:', `${QINIU_CONFIG.secretKey.substring(0, 8)}...`);
    console.log('  - Bucket Name:', QINIU_CONFIG.bucketName);
    console.log('  - Domain:', QINIU_CONFIG.domain);
    console.log('✅ 七牛云配置完整（硬编码）');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const key = formData.get('key') as string;
    const bucket = formData.get('bucket') as string;

    console.log('📤 上传参数:');
    console.log('  - 文件名:', file?.name);
    console.log('  - 文件大小:', file?.size, '字节');
    console.log('  - 文件类型:', file?.type);
    console.log('  - 文件Key:', key);
    console.log('  - 目标Bucket:', bucket);

    if (!file) {
      console.error('❌ 未找到上传文件');
      return NextResponse.json(
        { success: false, error: '未找到上传文件' },
        { status: 400 }
      );
    }

    if (!key) {
      console.error('❌ 未指定文件key');
      return NextResponse.json(
        { success: false, error: '未指定文件key' },
        { status: 400 }
      );
    }

    console.log(`🚀 开始上传文件到七牛云: ${key}`);

    // 保存上传的文件到临时目录
    const workDir = await fs.mkdtemp(join(tmpdir(), 'qiniu-upload-'));
    const tempFilePath = join(workDir, file.name);
    
    try {
      // 将File对象转换为Buffer并保存
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(tempFilePath, buffer);

      console.log(`📁 文件已保存到临时路径: ${tempFilePath}`);

      // 使用qiniu-uploader工具上传
      console.log('📡 调用七牛云上传函数...');
      const uploadResult = await uploadToQiniu(tempFilePath, key, bucket);

      console.log('📥 七牛云上传函数返回结果:', {
        success: uploadResult.success,
        url: uploadResult.url,
        key: uploadResult.key,
        error: uploadResult.error
      });

      // 清理临时文件
      console.log('🧹 清理临时文件:', workDir);
      await fs.rm(workDir, { recursive: true, force: true });

      if (uploadResult.success) {
        console.log(`✅ 七牛云上传成功: ${uploadResult.url}`);
        const response = {
          success: true,
          url: uploadResult.url,
          key: uploadResult.key,
          message: '文件上传成功'
        };
        console.log('📤 返回成功响应:', response);
        return NextResponse.json(response);
      } else {
        console.error(`❌ 七牛云上传失败: ${uploadResult.error}`);
        const response = { success: false, error: uploadResult.error };
        console.log('📤 返回失败响应:', response);
        return NextResponse.json(response, { status: 500 });
      }

    } catch (error) {
      // 清理临时文件
      await fs.rm(workDir, { recursive: true, force: true }).catch(console.warn);
      throw error;
    }

  } catch (error) {
    console.error('七牛云上传API错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '上传失败' 
      },
      { status: 500 }
    );
  }
}

/**
 * 上传文件到七牛云
 */
async function uploadToQiniu(filePath: string, key: string, bucket: string): Promise<{
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    try {
      // 使用qiniu命令行工具上传（如果可用）
      // 或者使用Node.js的qiniu包
      
      // 方案1: 使用qiniu命令行工具
      const qiniuCmd = spawn('qiniu-uploader', [
        '--access-key', QINIU_CONFIG.accessKey,
        '--secret-key', QINIU_CONFIG.secretKey,
        '--bucket', bucket,
        '--key', key,
        '--file', filePath
      ]);

      let stdout = '';
      let stderr = '';

      qiniuCmd.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      qiniuCmd.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      qiniuCmd.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            if (result.success) {
              resolve({
                success: true,
                url: result.url,
                key: result.key
              });
            } else {
              resolve({
                success: false,
                error: result.error || '上传失败'
              });
            }
          } catch {
            // 如果无法解析JSON，尝试从输出中提取URL
            const urlMatch = stdout.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
              resolve({
                success: true,
                url: urlMatch[0],
                key: key
              });
            } else {
              resolve({
                success: false,
                error: '无法解析上传结果'
              });
            }
          }
        } else {
          resolve({
            success: false,
            error: `上传命令执行失败: ${stderr || `退出码 ${code}`}`
          });
        }
      });

      qiniuCmd.on('error', (error) => {
        console.warn('qiniu-uploader命令不可用，尝试使用备用方案');
        // 备用方案：使用Node.js的qiniu包
        uploadWithNodeQiniu(filePath, key, bucket).then(resolve);
      });

    } catch (error) {
      console.warn('qiniu-uploader命令执行失败，使用备用方案');
      // 备用方案：使用Node.js的qiniu包
      uploadWithNodeQiniu(filePath, key, bucket).then(resolve);
    }
  });
}

/**
 * 使用Node.js的qiniu包上传（备用方案）
 */
async function uploadWithNodeQiniu(filePath: string, key: string, bucket: string): Promise<{
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}> {
  console.log('📦 使用Node.js qiniu包上传:');
  console.log('  - 文件路径:', filePath);
  console.log('  - 文件Key:', key);
  console.log('  - 目标Bucket:', bucket);
  
  try {
    // 动态导入qiniu包
    console.log('📥 导入qiniu包...');
    const qiniu = await import('qiniu');
    console.log('✅ qiniu包导入成功');
    
    console.log('🔐 创建认证和上传Token...');
    const auth = new qiniu.Auth(QINIU_CONFIG.accessKey, QINIU_CONFIG.secretKey);
    const token = auth.uploadToken(bucket, key);
    console.log('✅ Token创建成功');
    
    console.log('📤 开始上传文件...');
    return new Promise((resolve) => {
      qiniu.put_file(token, key, filePath, {}, (respErr, respBody, respInfo) => {
        console.log('📥 七牛云上传回调:');
        console.log('  - 错误:', respErr);
        console.log('  - 响应体:', respBody);
        console.log('  - 响应信息:', respInfo);
        
        if (respErr) {
          console.error('❌ 上传失败:', respErr.message);
          resolve({
            success: false,
            error: `上传失败: ${respErr.message}`
          });
        } else if (respInfo.statusCode === 200) {
          const url = `https://${QINIU_CONFIG.domain}/${key}`;
          console.log('✅ 上传成功, 生成URL:', url);
          resolve({
            success: true,
            url: url,
            key: key
          });
        } else {
          console.error('❌ 上传失败, 状态码:', respInfo.statusCode);
          resolve({
            success: false,
            error: `上传失败: HTTP ${respInfo.statusCode}`
          });
        }
      });
    });
    
  } catch (error) {
    const errorMsg = `qiniu包不可用: ${error instanceof Error ? error.message : String(error)}`;
    console.error('❌ qiniu包异常:', errorMsg);
    console.error('错误详情:', error);
    return {
      success: false,
      error: errorMsg
    };
  }
}
