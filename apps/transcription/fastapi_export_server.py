#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FastAPI Video Export Server - 视频导出Web服务
此文件提供基于FastAPI的视频导出API服务
文件路径: apps/transcription/fastapi_export_server.py
"""

import os
import json
import asyncio
import logging
from typing import Dict, Any, Generator, Optional
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# 导入我们的导出模块
from video_export_api import stream_export_video, VideoExporter
from video_data_handler import video_data_handler

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title="OpenCut Video Export API",
    description="Python实现的视频导出服务，支持流式进度推送",
    version="1.0.0"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境中应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class ExportRequest(BaseModel):
    """导出请求模型"""
    ir: Dict[str, Any] = Field(..., description="时间轴中间表示数据")
    options: Dict[str, Any] = Field(
        default={
            "quality": "standard",
            "codec": "libx264",
            "subtitleMode": "hard"
        },
        description="导出选项"
    )
    videoFiles: Optional[Dict[str, str]] = Field(
        default=None,
        description="视频文件base64数据，格式: {blobId: base64Data}"
    )

class ExportProgressResponse(BaseModel):
    """导出进度响应模型"""
    type: str = Field(..., description="事件类型")
    message: str = Field(..., description="进度消息")
    timestamp: str = Field(..., description="时间戳")
    progress: float = Field(None, description="进度百分比")
    stage: str = Field(None, description="当前阶段")
    current_time: float = Field(None, description="当前处理时间")
    total_time: float = Field(None, description="总时长")
    speed: float = Field(None, description="处理速度")
    frames: int = Field(None, description="已处理帧数")

# 全局变量
export_tasks: Dict[str, Dict[str, Any]] = {}  # 存储导出任务状态
export_results: Dict[str, Dict[str, Any]] = {}  # 存储导出结果

# 持久化存储工作目录映射
work_dir_mapping: Dict[str, str] = {}  # task_id -> work_dir

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "OpenCut Video Export API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_tasks": len(export_tasks),
        "completed_exports": len(export_results)
    }

@app.post("/api/export/stream")
async def stream_export(request: ExportRequest):
    """
    流式导出API - 支持Server-Sent Events
    使用SSE推送实时进度
    """
    
    # 生成任务ID
    task_id = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{os.getpid()}"
    
    # 记录任务开始
    export_tasks[task_id] = {
        "status": "starting",
        "start_time": datetime.now().isoformat(),
        "ir": request.ir,
        "options": request.options,
        "has_video_files": bool(request.videoFiles)
    }
    
    logger.info(f"开始导出任务: {task_id}")
    
    # 详细记录接收到的数据
    logger.info(f"=== 接收到的导出请求数据 ===")
    logger.info(f"IR数据类型: {type(request.ir)}")
    logger.info(f"IR数据键: {list(request.ir.keys()) if isinstance(request.ir, dict) else 'Not a dict'}")
    logger.info(f"Duration: {request.ir.get('duration', 'None')}")
    logger.info(f"Video count: {len(request.ir.get('video', [])) if isinstance(request.ir.get('video'), list) else 'Not a list'}")
    logger.info(f"Text count: {len(request.ir.get('texts', [])) if isinstance(request.ir.get('texts'), list) else 'Not a list'}")
    logger.info(f"Options: {request.options}")
    logger.info(f"Has video files: {bool(request.videoFiles)}")
    if request.videoFiles:
        logger.info(f"Video files count: {len(request.videoFiles)}")
        for blob_id in request.videoFiles.keys():
            data_size = len(request.videoFiles[blob_id]) if request.videoFiles[blob_id] else 0
            logger.info(f"  - {blob_id}: {data_size / 1024 / 1024 * 0.75:.1f}MB")
    logger.info(f"=================================")
    
    async def generate_progress():
        """生成进度流"""
        try:
            # 更新任务状态
            export_tasks[task_id]["status"] = "processing"
            
            # 🚀 处理视频文件数据并解析IR
            resolved_ir = request.ir
            video_processing_dir = None
            if request.videoFiles:
                logger.info(f"🚀 开始处理{len(request.videoFiles)}个视频文件...")
                
                # 创建临时工作目录
                import tempfile
                video_processing_dir = tempfile.mkdtemp(prefix='opencut-video-processing-')
                video_data_handler.set_work_dir(video_processing_dir)
                
                # 解析blob URL并替换为本地文件路径
                resolved_ir = video_data_handler.resolve_blob_urls(request.ir, request.videoFiles)
                logger.info("✅ 视频文件处理完成，IR已更新")
            
            # 调用导出函数
            async for progress in stream_export_video(resolved_ir, request.options):
                # 更新任务状态
                export_tasks[task_id]["status"] = "processing"
                export_tasks[task_id]["last_progress"] = progress
                
                # 如果是完成或错误状态，记录结果
                if progress.get('type') in ['complete', 'error']:
                    export_results[task_id] = {
                        "task_id": task_id,
                        "status": progress.get('type'),
                        "result": progress,
                        "completion_time": datetime.now().isoformat()
                    }
                    
                                    # 如果是完成状态，记录相关信息
                if progress.get('type') == 'complete':
                    # 检查是否使用云存储
                    if progress.get('cloud_storage', False):
                        logger.info(f'任务 {task_id} 使用云存储，下载URL: {progress.get("download_url")}')
                        # 🧹 云存储成功后，清理本地临时文件
                        if progress.get('work_dir'):
                            try:
                                import shutil
                                shutil.rmtree(progress.get('work_dir'))
                                logger.info(f'🧹 云存储成功后清理本地工作目录: {progress.get("work_dir")}')
                            except Exception as e:
                                logger.warning(f'⚠️ 清理本地工作目录失败: {e}')
                    else:
                        # 从progress中获取工作目录信息
                        work_dir = progress.get('work_dir', '')
                        if work_dir:
                            export_results[task_id]["work_dir"] = work_dir
                            # 同时保存到持久化映射中
                            work_dir_mapping[task_id] = work_dir
                            logger.info(f'记录任务 {task_id} 的工作目录: {work_dir}')
                            logger.info(f'工作目录映射已更新: {work_dir_mapping}')
                    
                    # 清理任务记录
                    if task_id in export_tasks:
                        del export_tasks[task_id]
                
                # 🧹 清理视频处理临时目录
                if video_processing_dir and os.path.exists(video_processing_dir):
                    try:
                        import shutil
                        shutil.rmtree(video_processing_dir)
                        logger.info(f'🧹 清理视频处理临时目录: {video_processing_dir}')
                    except Exception as e:
                        logger.warning(f'⚠️ 清理视频处理目录失败: {e}')
                
                # 发送SSE数据
                yield f"data: {json.dumps(progress, ensure_ascii=False)}\n\n"
                
        except Exception as error:
            logger.error(f"导出任务 {task_id} 失败: {error}")
            
            # 记录错误
            export_results[task_id] = {
                "task_id": task_id,
                "status": "error",
                "error": str(error),
                "completion_time": datetime.now().isoformat()
            }
            
            # 清理任务记录
            if task_id in export_tasks:
                del export_tasks[task_id]
            
            # 🧹 错误情况下也要清理临时目录
            if video_processing_dir and os.path.exists(video_processing_dir):
                try:
                    import shutil
                    shutil.rmtree(video_processing_dir)
                    logger.info(f'🧹 错误情况下清理视频处理临时目录: {video_processing_dir}')
                except Exception as e:
                    logger.warning(f'⚠️ 清理视频处理目录失败: {e}')
            
            # 发送错误信息
            error_progress = {
                "type": "error",
                "message": f"导出失败: {str(error)}",
                "timestamp": datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_progress, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        generate_progress(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    )

@app.post("/api/export/sync")
async def sync_export(request: ExportRequest):
    """
    同步导出API - 等待导出完成并返回结果
    """
    
    task_id = f"sync_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{os.getpid()}"
    
    # 记录任务开始
    export_tasks[task_id] = {
        "status": "starting",
        "start_time": datetime.now().isoformat(),
        "ir": request.ir,
        "options": request.options
    }
    
    try:
        # 收集所有进度信息
        progress_list = []
        final_result = None
        
        async for progress in stream_export_video(request.ir, request.options):
            progress_list.append(progress)
            
            if progress.get('type') in ['complete', 'error']:
                final_result = progress
                break
        
        # 记录结果
        export_results[task_id] = {
            "task_id": task_id,
            "status": final_result.get('type') if final_result else 'unknown',
            "result": final_result,
            "progress_history": progress_list,
            "completion_time": datetime.now().isoformat()
        }
        
        # 清理任务记录
        if task_id in export_tasks:
            del export_tasks[task_id]
        
        return {
            "task_id": task_id,
            "success": final_result.get('type') == 'complete',
            "result": final_result,
            "progress_history": progress_list
        }
        
    except Exception as error:
        logger.error(f"同步导出任务 {task_id} 失败: {error}")
        
        # 记录错误
        export_results[task_id] = {
            "task_id": task_id,
            "status": "error",
            "error": str(error),
            "completion_time": datetime.now().isoformat()
        }
        
        # 清理任务记录
        if task_id in export_tasks:
            del export_tasks[task_id]
        
        raise HTTPException(status_code=500, detail=f"导出失败: {str(error)}")

@app.get("/api/export/status/{task_id}")
async def get_export_status(task_id: str):
    """获取导出任务状态"""
    
    # 检查活跃任务
    if task_id in export_tasks:
        return {
            "task_id": task_id,
            "status": "active",
            "task_info": export_tasks[task_id]
        }
    
    # 检查已完成任务
    if task_id in export_results:
        return {
            "task_id": task_id,
            "status": "completed",
            "result": export_results[task_id]
        }
    
    raise HTTPException(status_code=404, detail="任务不存在")

@app.get("/api/export/tasks")
async def list_export_tasks():
    """列出所有导出任务"""
    return {
        "active_tasks": export_tasks,
        "completed_tasks": export_results,
        "total_active": len(export_tasks),
        "total_completed": len(export_results)
    }

@app.delete("/api/export/tasks/{task_id}")
async def cancel_export_task(task_id: str):
    """取消导出任务"""
    
    if task_id in export_tasks:
        # 标记任务为取消状态
        export_tasks[task_id]["status"] = "cancelled"
        export_tasks[task_id]["cancellation_time"] = datetime.now().isoformat()
        
        # 移动到结果记录
        export_results[task_id] = {
            "task_id": task_id,
            "status": "cancelled",
            "cancellation_time": datetime.now().isoformat()
        }
        
        # 清理活跃任务记录
        del export_tasks[task_id]
        
        return {"message": f"任务 {task_id} 已取消"}
    
    raise HTTPException(status_code=404, detail="任务不存在")

@app.get("/api/export/download/{task_id}")
async def download_export_result(task_id: str):
    """下载导出结果文件"""
    
    if task_id not in export_results:
        raise HTTPException(status_code=404, detail="导出结果不存在")
    
    result = export_results[task_id]
    
    if result.get("status") != "complete":
        raise HTTPException(status_code=400, detail="导出尚未完成")
    
    # 尝试多种方式找到输出文件
    output_path = None
    
    # 方法1：从持久化工作目录映射中查找（最可靠）
    if task_id in work_dir_mapping:
        work_dir = work_dir_mapping[task_id]
        potential_output = os.path.join(work_dir, "output.mp4")
        if os.path.exists(potential_output):
            output_path = potential_output
            logger.info(f'从持久化映射找到输出文件: {output_path}')
    
    # 方法2：从result中获取output_path
    if not output_path and result.get("result", {}).get("output_path"):
        output_path = result.get("result", {}).get("output_path")
        logger.info(f'从result中找到输出文件: {output_path}')
    
    # 方法3：从工作目录中查找
    if not output_path and result.get("work_dir"):
        work_dir = result.get("work_dir")
        potential_output = os.path.join(work_dir, "output.mp4")
        if os.path.exists(potential_output):
            output_path = potential_output
            logger.info(f'从工作目录找到输出文件: {output_path}')
    
    # 方法4：从任务记录中查找
    if not output_path and task_id in export_tasks:
        work_dir = export_tasks[task_id].get("work_dir", "")
        if work_dir:
            potential_output = os.path.join(work_dir, "output.mp4")
            if os.path.exists(potential_output):
                output_path = potential_output
                logger.info(f'从任务记录找到输出文件: {output_path}')
    
    if not output_path or not os.path.exists(output_path):
        logger.error(f'无法找到任务 {task_id} 的输出文件')
        logger.error(f'Result: {result}')
        if task_id in export_tasks:
            logger.error(f'Task: {export_tasks[task_id]}')
        raise HTTPException(status_code=404, detail="输出文件不存在")
    
    logger.info(f'准备下载文件: {output_path}')
    
    # 返回文件，并在下载完成后清理工作目录
    async def cleanup_after_download():
        """下载完成后清理工作目录"""
        try:
            import shutil
            if task_id in work_dir_mapping:
                work_dir = work_dir_mapping[task_id]
                if os.path.exists(work_dir):
                    shutil.rmtree(work_dir)
                    logger.info(f'下载完成后清理工作目录: {work_dir}')
                    # 清理映射记录
                    del work_dir_mapping[task_id]
                    logger.info(f'清理工作目录映射: {work_dir_mapping}')
        except Exception as e:
            logger.warning(f'清理工作目录失败: {e}')
    
    # 启动异步清理任务
    import asyncio
    asyncio.create_task(cleanup_after_download())
    
    return FileResponse(
        path=output_path,
        filename=f"export_{task_id}.mp4",
        media_type="video/mp4"
    )

@app.post("/api/export/validate")
async def validate_export_request(request: ExportRequest):
    """验证导出请求"""
    
    validation_errors = []
    
    # 验证IR数据
    ir = request.ir
    
    if not ir.get('width') or not ir.get('height'):
        validation_errors.append("缺少视频分辨率信息")
    
    if not ir.get('fps'):
        validation_errors.append("缺少帧率信息")
    
    if not ir.get('duration'):
        validation_errors.append("缺少时长信息")
    
    if not ir.get('video'):
        validation_errors.append("缺少视频轨道信息")
    
    # 验证选项
    options = request.options
    
    valid_qualities = ['preview', 'standard', 'professional']
    if options.get('quality') not in valid_qualities:
        validation_errors.append(f"无效的质量设置，必须是: {', '.join(valid_qualities)}")
    
    valid_codecs = ['libx264', 'libx265', 'libvpx-vp9', 'libaom-av1']
    if options.get('codec') and options.get('codec') not in valid_codecs:
        validation_errors.append(f"无效的编码器，必须是: {', '.join(valid_codecs)}")
    
    if validation_errors:
        return {
            "valid": False,
            "errors": validation_errors
        }
    
    return {
        "valid": True,
        "message": "请求验证通过"
    }

# 启动脚本
if __name__ == "__main__":
    # 配置服务器
    host = os.getenv("EXPORT_API_HOST", "0.0.0.0")
    port = int(os.getenv("EXPORT_API_PORT", "8000"))
    
    logger.info(f"启动视频导出API服务器: {host}:{port}")
    
    # 启动服务器
    uvicorn.run(
        "fastapi_export_server:app",
        host=host,
        port=port,
        reload=True,  # 开发模式启用热重载
        log_level="info"
    )
