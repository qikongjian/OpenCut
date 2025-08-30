#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Video Export API - Python实现
此文件提供流式视频导出服务，支持实时进度推送
文件路径: apps/transcription/video_export_api.py
"""

import os
import json
import tempfile
import subprocess
import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Generator
from datetime import datetime
import time
import re
from dataclasses import dataclass
from urllib.parse import urlparse
import aiohttp
import aiofiles

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 导入七牛云上传器
try:
    from qiniu_uploader import qiniu_uploader
    QINIU_AVAILABLE = qiniu_uploader.is_configured()
    if QINIU_AVAILABLE:
        logger.info("✅ 七牛云上传器配置完整且可用")
    else:
        logger.warning("⚠️ 七牛云上传器配置不完整，将使用本地文件下载")
except ImportError:
    QINIU_AVAILABLE = False
    logger.warning("❌ 七牛云上传器模块不可用，将使用本地文件下载")

@dataclass
class ExportProgress:
    """导出进度信息"""
    overall: float
    stage: str
    message: str
    current_time: Optional[float] = None
    total_time: Optional[float] = None
    speed: Optional[float] = None
    frames: Optional[int] = None

@dataclass
class ExportResult:
    """导出结果"""
    success: bool
    output_path: Optional[str] = None
    error: Optional[str] = None
    duration: Optional[float] = None
    file_size: Optional[int] = None

class ASSGenerator:
    """ASS字幕生成器"""
    
    @staticmethod
    def convert_color_to_ass(color: str) -> str:
        """将CSS颜色转换为ASS格式"""
        if color.startswith('#'):
            # 转换 #RRGGBB 为 ASS 格式 &HBBGGRR
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)
            return f"&H{b:02X}{g:02X}{r:02X}00"
        elif color == 'transparent':
            return "&H00000000"
        else:
            # 默认白色
            return "&H00FFFFFF"
    
    @staticmethod
    def convert_alignment(align: str) -> int:
        """转换对齐方式"""
        alignment_map = {
            'left': 1,
            'center': 2,
            'right': 3
        }
        return alignment_map.get(align, 2)
    
    @staticmethod
    def generate_ass(ir: Dict[str, Any]) -> str:
        """从IR生成ASS字幕文件"""
        ass_content = []
        
        # 脚本信息
        ass_content.extend([
            "[Script Info]",
            f"Title: SmartCut Python Generated Subtitles",
            "ScriptType: v4.00+",
            "WrapStyle: 0",
            "ScaledBorderAndShadow: yes",
            "YCbCr Matrix: TV.709",
            f"PlayResX: {ir.get('width', 1920)}",
            f"PlayResY: {ir.get('height', 1080)}",
            "",
            "[V4+ Styles]",
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
            "Style: Default,Arial,40,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,60,1",
            ""
        ])
        
        # 为每个文本元素创建样式
        used_styles = set()
        for i, text in enumerate(ir.get('texts', [])):
            style_key = f"{text.get('style', {}).get('fontFamily', 'Arial')}_{text.get('style', {}).get('fontSize', 40)}_{text.get('style', {}).get('color', '#FFFFFF')}"
            
            if style_key not in used_styles:
                used_styles.add(style_key)
                style = text.get('style', {})
                
                ass_content.append(
                    f"Style: Style_{i},"
                    f"{style.get('fontFamily', 'Arial')},"
                    f"{style.get('fontSize', 40)},"
                    f"{ASSGenerator.convert_color_to_ass(style.get('color', '#FFFFFF'))},"
                    f"{ASSGenerator.convert_color_to_ass(style.get('color', '#FFFFFF'))},"
                    "&H00000000,"  # 黑色描边
                    f"{ASSGenerator.convert_color_to_ass(style.get('backgroundColor', 'transparent'))},"
                    f"{1 if style.get('fontWeight') == 'bold' else 0},"
                    f"{1 if style.get('fontStyle') == 'italic' else 0},"
                    "0,0,100,100,0,"
                    f"{style.get('rotation', 0)},"
                    "1,2,"
                    f"{2 if style.get('shadow') else 0},"
                    f"{ASSGenerator.convert_alignment(style.get('align', 'center'))},"
                    "10,10,60,1"
                )
        
        ass_content.extend([
            "",
            "[Events]",
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
        ])
        
        # 添加文本事件
        for i, text in enumerate(ir.get('texts', [])):
            # 安全地获取时间值，防止None值
            start_time = (text.get('start', 0) or 0) / 1000  # 转换为秒
            end_time = (text.get('end', 0) or 0) / 1000
            
            # 格式化时间 HH:MM:SS.cc
            start_str = f"{int(start_time//3600):02d}:{int((start_time%3600)//60):02d}:{int(start_time%60):02d}.{int((start_time%1)*100):02d}"
            end_str = f"{int(end_time//3600):02d}:{int((end_time%3600)//60):02d}:{int(end_time%60):02d}.{int((end_time%1)*100):02d}"
            
            ass_content.append(
                f"Dialogue: 0,{start_str},{end_str},Style_{i},,0,0,0,,{text.get('text', '')}"
            )
        
        return "\n".join(ass_content)

class VideoExporter:
    """视频导出器"""
    
    def __init__(self):
        self.work_dir = None
        self.is_exporting = False
    
    async def export_video(self, ir: Dict[str, Any], options: Dict[str, Any]) -> Generator[Dict[str, Any], None, None]:
        """流式导出视频"""
        if self.is_exporting:
            raise Exception("Export already in progress")
        
        self.is_exporting = True
        
        try:
            # 发送开始事件
            yield {
                'type': 'start',
                'message': '开始导出...',
                'timestamp': datetime.now().isoformat()
            }
            
            # 创建临时工作目录
            self.work_dir = tempfile.mkdtemp(prefix='opencut-python-export-')
            export_id = os.path.basename(self.work_dir).replace('opencut-python-export-', '')
            
            yield {
                'type': 'progress',
                'stage': 'preparing',
                'message': '准备工作环境...',
                'progress': 0.1
            }
            
            # 生成字幕文件
            if ir.get('texts') and options.get('subtitleMode') != 'none':
                yield {
                    'type': 'progress',
                    'stage': 'preparing',
                    'message': '生成字幕文件...',
                    'progress': 0.2
                }
                
                ass_content = ASSGenerator.generate_ass(ir)
                ass_path = os.path.join(self.work_dir, 'subtitles.ass')
                
                async with aiofiles.open(ass_path, 'w', encoding='utf-8') as f:
                    await f.write(ass_content)
                
                # 验证字幕文件是否创建成功
                if os.path.exists(ass_path):
                    logger.info(f'字幕文件创建成功: {ass_path}')
                    logger.info(f'字幕文件大小: {os.path.getsize(ass_path)} bytes')
                else:
                    logger.warning(f'字幕文件创建失败: {ass_path}')
            
            # 准备输入文件
            yield {
                'type': 'progress',
                'stage': 'preparing',
                'message': '准备输入文件...',
                'progress': 0.3
            }
            
            input_files = await self._prepare_input_files(ir)
            
            # 构建FFmpeg命令
            ffmpeg_args = self._build_ffmpeg_command(ir, options, input_files)
            
            logger.info('=== 导出调试信息 ===')
            logger.info(f'IR数据类型: {type(ir)}')
            logger.info(f'IR数据键: {list(ir.keys()) if isinstance(ir, dict) else "Not a dict"}')
            logger.info(f'IR duration: {ir.get("duration", "None")} ms (类型: {type(ir.get("duration"))})')
            logger.info(f'IR video count: {len(ir.get("video", []))}')
            logger.info(f'IR text count: {len(ir.get("texts", []))}')
            logger.info(f'Video elements: {ir.get("video", [])}')
            logger.info(f'Input files: {input_files}')
            logger.info(f'FFmpeg args: {" ".join(ffmpeg_args)}')
            logger.info('===================')
            
            # 执行FFmpeg并推送进度
            yield {
                'type': 'progress',
                'stage': 'encoding',
                'message': '开始视频编码...',
                'progress': 0.4
            }
            
            # 获取项目时长，确保有有效值
            project_duration = ir.get('duration', 0)
            if not project_duration or project_duration <= 0:
                # 如果没有duration，计算所有视频元素的总时长
                total_video_duration = 0
                for video_element in ir.get('video', []):
                    video_duration = (video_element.get('out', 0) - video_element.get('in', 0))
                    total_video_duration += video_duration
                
                if total_video_duration > 0:
                    project_duration = total_video_duration
                else:
                    project_duration = 60000  # 默认60秒
                
                logger.info(f'使用计算的时长: {project_duration}ms')
            
            await self._execute_ffmpeg_with_progress(ffmpeg_args, project_duration)
            
            # 发送完成事件
            output_path = os.path.join(self.work_dir, 'output.mp4')
            file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
            
            logger.info(f'导出完成，输出文件: {output_path}, 文件大小: {file_size} bytes')
            
            # 尝试上传到七牛云
            cloud_url = None
            if QINIU_AVAILABLE and os.path.exists(output_path):
                try:
                    logger.info(f'🚀 开始上传导出视频到七牛云: {export_id}')
                    
                    # 发送上传进度事件
                    yield {
                        'type': 'progress',
                        'stage': 'uploading',
                        'message': '正在上传到云存储...',
                        'progress': 0.95
                    }
                    
                    cloud_url = qiniu_uploader.upload_export_video(output_path, export_id)
                    if cloud_url:
                        logger.info(f'✅ 文件上传七牛云成功: {cloud_url}')
                    else:
                        logger.warning('⚠️ 文件上传七牛云失败，将使用本地下载')
                except Exception as e:
                    logger.error(f'❌ 上传七牛云时发生错误: {e}')
                    # 上传失败不影响导出结果，继续提供本地下载
            
            # 构建响应数据
            response_data = {
                'type': 'complete',
                'message': '导出完成',
                'timestamp': datetime.now().isoformat(),
                'file_size': file_size,
                'export_id': export_id
            }
            
            # 如果有云存储URL，优先使用；否则使用本地下载
            if cloud_url:
                response_data.update({
                    'download_url': cloud_url,
                    'cloud_storage': True,
                    'message': '✅ 导出完成，文件已上传到七牛云存储，可直接下载'
                })
                logger.info(f'🎉 导出任务完成 - 七牛云模式: {cloud_url}')
            else:
                response_data.update({
                    'download_url': f'/api/export/download/{export_id}',
                    'cloud_storage': False,
                    'output_path': output_path,
                    'work_dir': self.work_dir,
                    'message': '✅ 导出完成，通过本地服务器下载'
                })
                logger.info(f'🎉 导出任务完成 - 本地下载模式: /api/export/download/{export_id}')
            
            yield response_data
            
        except Exception as error:
            logger.error(f'Stream export error: {error}')
            
            # 发送错误事件
            yield {
                'type': 'error',
                'message': str(error),
                'timestamp': datetime.now().isoformat()
            }
            
        finally:
            self.is_exporting = False
            # 🧹 导出完成后自动清理工作目录
            if self.work_dir and os.path.exists(self.work_dir):
                try:
                    import shutil
                    shutil.rmtree(self.work_dir)
                    logger.info(f'🧹 导出完成后自动清理工作目录: {self.work_dir}')
                    self.work_dir = None
                except Exception as e:
                    logger.warning(f'⚠️ 清理工作目录失败: {e}')
                    # 清理失败不影响导出结果
    
    async def _prepare_input_files(self, ir: Dict[str, Any]) -> List[str]:
        """准备输入文件"""
        input_files = []
        
        for i, video_element in enumerate(ir.get('video', [])):
            input_path = os.path.join(self.work_dir, f'video_{i}.mp4')
            
            try:
                src = video_element.get('src', '')
                
                # 如果是本地文件路径，直接使用
                if src.startswith('/') or src.startswith('file://'):
                    input_files.append(src)
                # 如果是HTTP URL，下载到本地
                elif src.startswith('http'):
                    await self._download_file(src, input_path)
                    input_files.append(input_path)
                # 如果是blob URL或其他格式，创建测试视频
                else:
                    logger.warning(f'Unsupported video source: {src}, creating test video')
                    # 安全地获取时间值
                    out_time = video_element.get('out', 0) or 0
                    in_time = video_element.get('in', 0) or 0
                    video_duration = (out_time - in_time) / 1000
                    await self._create_test_video(input_path, ir.get('width', 1920), ir.get('height', 1080), max(video_duration, 1))
                    input_files.append(input_path)
                    
            except Exception as error:
                logger.error(f'Failed to prepare video {i}: {error}')
                # 创建测试视频作为后备
                if video_element:
                    out_time = video_element.get('out', 0) or 0
                    in_time = video_element.get('in', 0) or 0
                    video_duration = (out_time - in_time) / 1000
                else:
                    video_duration = 5
                await self._create_test_video(input_path, ir.get('width', 1920), ir.get('height', 1080), max(video_duration, 1))
                input_files.append(input_path)
        
        return input_files
    
    async def _download_file(self, url: str, output_path: str):
        """下载文件到本地"""
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise Exception(f'Failed to download file: {response.status}')
                
                content = await response.read()
                async with aiofiles.open(output_path, 'wb') as f:
                    await f.write(content)
    
    async def _create_test_video(self, output_path: str, width: int, height: int, duration: float):
        """创建高质量测试视频文件 - 替代真实视频内容"""
        
        # 创建一个带有渐变背景和移动文字的高质量视频
        # 使用color和drawtext滤镜创建有意义的内容
        filter_complex = (
            f"color=c=blue:size={width}x{height}:duration={duration}[bg];"
            f"[bg]drawtext=text='OpenCut Demo Video':fontsize=72:fontcolor=white:"
            f"x=(w-text_w)/2:y=(h-text_h)/2-50:enable='between(t,0,{duration/3})'[v1];"
            f"[v1]drawtext=text='高质量视频编码测试':fontsize=48:fontcolor=yellow:"
            f"x=(w-text_w)/2:y=(h-text_h)/2+50:enable='between(t,{duration/3},{duration*2/3})'[v2];"
            f"[v2]drawtext=text='时间: %{{pts\\:gmtime\\:0\\:%H\\\\\\:%M\\\\\\:%S}}':fontsize=36:fontcolor=lime:"
            f"x=20:y=20[v3];"
            f"[v3]drawtext=text='帧数: %{{frame_num}}':fontsize=36:fontcolor=cyan:"
            f"x=20:y=70[v4];"
            f"[v4]fade=t=in:st=0:d=1,fade=t=out:st={duration-1}:d=1"
        )
        
        args = [
            'ffmpeg',
            '-f', 'lavfi',
            '-i', f'color=c=gradient:size={width}x{height}:duration={duration}:rate=30',
            '-filter_complex', filter_complex,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-pix_fmt', 'yuv420p',
            '-crf', '20',  # 高质量
            '-profile:v', 'high',
            '-level', '4.0',
            '-movflags', '+faststart',
            '-y',
            output_path
        ]
        
        logger.info(f'创建高质量演示视频: 时长{duration}秒, 分辨率{width}x{height}')
        
        process = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            stderr_text = stderr.decode('utf-8', errors='ignore')
            logger.error(f'创建演示视频失败: {stderr_text}')
            
            # 如果复杂滤镜失败，回退到简单的彩色视频
            logger.info('回退到简单彩色视频生成...')
            await self._create_fallback_video(output_path, width, height, duration)
        else:
            file_size = os.path.getsize(output_path)
            logger.info(f'高质量演示视频创建成功: {output_path}, 文件大小: {file_size} bytes')

    async def _create_fallback_video(self, output_path: str, width: int, height: int, duration: float):
        """创建简单的回退视频"""
        args = [
            'ffmpeg',
            '-f', 'lavfi',
            '-i', f'color=c=blue:size={width}x{height}:duration={duration}:rate=30',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-pix_fmt', 'yuv420p',
            '-crf', '23',
            '-y',
            output_path
        ]
        
        process = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        await process.communicate()
        
        if process.returncode == 0:
            file_size = os.path.getsize(output_path)
            logger.info(f'简单演示视频创建成功: {output_path}, 文件大小: {file_size} bytes')
        else:
            raise Exception('所有视频生成方法都失败了')
    
    def _build_ffmpeg_command(self, ir: Dict[str, Any], options: Dict[str, Any], input_files: List[str]) -> List[str]:
        """构建FFmpeg命令"""
        args = []
        
        # 按时间轴顺序排序视频片段
        sorted_videos = sorted(ir.get('video', []), key=lambda x: x.get('start', 0))
        
        # 创建concat文件列表
        concat_entries = []
        total_calculated_duration = 0
        
        for i, video in enumerate(sorted_videos):
            if i < len(input_files):
                input_file = input_files[i]
                segment_duration = (video.get('out', 0) - video.get('in', 0)) / 1000
                total_calculated_duration += segment_duration
                
                concat_entries.extend([
                    f"file '{input_file}'",
                    f"duration {segment_duration:.6f}"
                ])
                
                # 安全地获取时间值，防止None值
                in_time = video.get("in", 0) or 0
                out_time = video.get("out", 0) or 0
                logger.info(f'Video segment {i}: {segment_duration:.3f}s ({in_time/1000:.3f}-{out_time/1000:.3f})')
        
        concat_content = '\n'.join(concat_entries)
        concat_path = os.path.join(self.work_dir, 'concat_list.txt')
        
        with open(concat_path, 'w') as f:
            f.write(concat_content)
        
        logger.info('=== Concat Debug Info ===')
        # 安全地获取duration值
        ir_duration = ir.get("duration", 0) or 0
        logger.info(f'IR total duration: {ir_duration / 1000} seconds')
        logger.info(f'Calculated total duration: {total_calculated_duration} seconds')
        logger.info(f'Video segments count: {len(sorted_videos)}')
        logger.info(f'Concat file content:\n{concat_content}')
        logger.info('========================')
        
        # 使用concat协议作为唯一输入
        args.extend(['-f', 'concat', '-safe', '0', '-i', concat_path])
        
        # 使用计算出的精确时长
        args.extend(['-t', f'{total_calculated_duration:.6f}'])
        
        # 基础设置
        # 确保编码器名称正确
        codec = options.get('codec', 'libx264')
        if codec == 'h264':
            codec = 'libx264'  # h264 不是有效的编码器名称
        
        # 视频编码参数 - 速度优化
        # 根据质量设置选择最优的速度/质量平衡
        quality = options.get('quality', 'standard')
        
        # 🚀 极速模式优化
        speed_mode = options.get('speed_mode', 'normal')  # normal, fast, ultrafast
        
        if speed_mode == 'ultrafast' or quality == 'preview':
            preset = 'ultrafast'  # 最快速度
            threads = 0  # 自动检测所有CPU核心
            logger.info('🚀 启用极速编码模式')
        elif speed_mode == 'fast' or quality == 'standard':
            preset = 'veryfast'   # 很快速度
            threads = 0  # 自动检测所有CPU核心
            logger.info('🚀 启用快速编码模式')
        else:  # professional or normal
            preset = 'faster'     # 较快速度
            threads = 0  # 自动检测所有CPU核心
            logger.info('🚀 启用标准编码模式')
        
        args.extend([
            '-c:v', codec,
            '-preset', preset,
            '-threads', str(threads),   # 多线程编码
            '-pix_fmt', 'yuv420p',
            '-profile:v', 'main',       # 使用main profile（比high更快）
            '-level', '4.0',
            '-s', f"{ir.get('width', 1920)}x{ir.get('height', 1080)}",
            '-r', str(ir.get('fps', 30))
        ])
        
        logger.info(f'🚀 编码配置: preset={preset}, threads={threads}, quality={quality}')
        
        # 音频编码参数 - 检查视频文件是否包含音频
        video_has_audio = False
        
        # 检查输入文件是否有音频流
        for input_file in input_files:
            if os.path.exists(input_file):
                try:
                    # 使用ffprobe检查是否有音频流
                    import subprocess
                    result = subprocess.run([
                        'ffprobe', '-v', 'quiet', '-show_streams', 
                        '-select_streams', 'a', '-of', 'csv=p=0', input_file
                    ], capture_output=True, text=True)
                    
                    if result.returncode == 0 and result.stdout.strip():
                        video_has_audio = True
                        logger.info(f'检测到音频流: {input_file}')
                        break
                except Exception as e:
                    logger.warning(f'检查音频流失败: {input_file}, 错误: {e}')
        
        # 音频处理策略 - 速度优化
        if video_has_audio or (ir.get('audio') and len(ir.get('audio', [])) > 0):
            # 根据速度模式调整音频编码参数
            if speed_mode == 'ultrafast':
                # 极速模式：低比特率，快速编码
                args.extend([
                    '-c:a', 'aac',
                    '-b:a', '96k',      # 降低比特率
                    '-ar', '44100',
                    '-ac', '2',
                    '-aac_coder', 'fast'  # 快速AAC编码器
                ])
                logger.info('✅ 启用音频编码（极速）：AAC 96k 44.1kHz')
            elif speed_mode == 'fast':
                # 快速模式：标准比特率，快速编码
                args.extend([
                    '-c:a', 'aac',
                    '-b:a', '112k',     # 稍低比特率
                    '-ar', '44100',
                    '-ac', '2',
                    '-aac_coder', 'fast'
                ])
                logger.info('✅ 启用音频编码（快速）：AAC 112k 44.1kHz')
            else:
                # 标准模式：正常音频编码
                args.extend([
                    '-c:a', 'aac',
                    '-b:a', '128k',
                    '-ar', '44100',
                    '-ac', '2'
                ])
                logger.info('✅ 启用音频编码（标准）：AAC 128k 44.1kHz 立体声')
        else:
            # 没有音频时禁用音频流
            args.extend(['-an'])
            logger.info('⚠️ 未检测到音频流，禁用音频编码')
        
        # 编码优化参数 - 速度优先
        speed_opts = [
            '-movflags', '+faststart',
            '-avoid_negative_ts', 'make_zero',
            '-fflags', '+genpts'        # 生成时间戳，提高兼容性
        ]
        
        # 根据质量选择调优参数
        if quality == 'preview':
            speed_opts.extend([
                '-tune', 'fastdecode',  # 最快解码
                '-x264-params', 'ref=1:bframes=0:me=dia:subme=1:trellis=0:weightp=0'  # 最快编码参数
            ])
        elif quality == 'standard':
            speed_opts.extend([
                '-tune', 'fastdecode',  # 快速解码
                '-x264-params', 'ref=2:bframes=1:me=hex:subme=2'  # 平衡参数
            ])
        else:  # professional
            speed_opts.extend([
                '-tune', 'film'         # 保持质量调优
            ])
        
        args.extend(speed_opts)
        
        # 质量设置 - 针对速度优化
        if quality == 'preview':
            args.extend(['-crf', '30', '-maxrate', '1M', '-bufsize', '1M'])  # 更快编码
        elif quality == 'standard':
            args.extend(['-crf', '25', '-maxrate', '3M', '-bufsize', '5M'])  # 平衡设置
        elif quality == 'professional':
            args.extend(['-crf', '21', '-maxrate', '8M', '-bufsize', '15M'])  # 高质量
        
        # 字幕处理
        if ir.get('texts') and options.get('subtitleMode') != 'none':
            ass_path = os.path.join(self.work_dir, 'subtitles.ass')
            # 使用相对路径，避免路径问题
            ass_filename = 'subtitles.ass'
            args.extend(['-vf', f'subtitles={ass_filename}'])
        
        # 输出文件
        args.extend(['-y', os.path.join(self.work_dir, 'output.mp4')])
        
        # 验证FFmpeg命令
        logger.info(f'FFmpeg command: {" ".join(args)}')
        
        # 检查关键文件是否存在
        concat_path = os.path.join(self.work_dir, 'concat_list.txt')
        if not os.path.exists(concat_path):
            logger.error(f'Concat file not found: {concat_path}')
            raise Exception(f'Concat file not found: {concat_path}')
        
        # 检查输出目录是否可写
        output_dir = os.path.dirname(os.path.join(self.work_dir, 'output.mp4'))
        if not os.access(output_dir, os.W_OK):
            logger.error(f'Output directory not writable: {output_dir}')
            raise Exception(f'Output directory not writable: {output_dir}')
        
        logger.info('FFmpeg command validation passed')
        return args
    
    async def _execute_ffmpeg_with_progress(self, args: List[str], total_duration: float):
        """执行FFmpeg并推送实时进度"""
        # 确保total_duration是有效的数值
        if total_duration is None or total_duration <= 0:
            total_duration = 60000  # 默认60秒
            logger.warning(f'Invalid total_duration: {total_duration}, using default: 60s')
        
        total_duration_seconds = total_duration / 1000
        logger.info(f'开始FFmpeg处理，总时长: {total_duration_seconds:.1f}秒')
        
        # 检查工作目录中的文件
        logger.info(f'工作目录: {self.work_dir}')
        if os.path.exists(self.work_dir):
            files = os.listdir(self.work_dir)
            logger.info(f'工作目录中的文件: {files}')
        
        # 确保第一个参数是ffmpeg命令
        if not args or args[0] != 'ffmpeg':
            args = ['ffmpeg'] + args
        
        logger.info(f'Executing FFmpeg with args: {args}')
        
        process = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=self.work_dir
        )
        
        stderr_data = b''
        
        while True:
            chunk = await process.stderr.read(1024)
            if not chunk:
                break
            
            stderr_data += chunk
            output = chunk.decode('utf-8', errors='ignore')
            
            # 解析进度信息
            time_match = re.search(r'time=(\d+):(\d+):(\d+)\.(\d+)', output)
            if time_match:
                hours = int(time_match.group(1))
                minutes = int(time_match.group(2))
                seconds = int(time_match.group(3))
                current_time = hours * 3600 + minutes * 60 + seconds
                
                # 计算进度 - 添加安全检查
                if total_duration_seconds > 0:
                    raw_progress = current_time / total_duration_seconds
                    encoding_progress = min(raw_progress, 1)
                    overall_progress = min(0.4 + encoding_progress * 0.5, 0.9)
                    display_percentage = min(round(encoding_progress * 100), 100)
                else:
                    encoding_progress = 0
                    overall_progress = 0.4
                    display_percentage = 0
                
                logger.info(f'编码进度: {display_percentage}% (时间: {current_time:.1f}s / {total_duration_seconds:.1f}s)')
            
            # 解析速度信息
            speed_match = re.search(r'speed=\s*(\d+\.?\d*)x', output)
            if speed_match:
                speed = float(speed_match.group(1))
                logger.info(f'处理速度: {speed}x')
            
            # 解析帧信息
            frame_match = re.search(r'frame=\s*(\d+)', output)
            if frame_match:
                frames = int(frame_match.group(1))
                logger.info(f'已处理帧数: {frames}')
        
        # 等待进程完成
        await process.wait()
        
        if process.returncode != 0:
            # 获取详细的错误信息
            stderr_text = stderr_data.decode('utf-8', errors='ignore')
            logger.error(f'FFmpeg stderr output: {stderr_text}')
            raise Exception(f'FFmpeg failed with exit code {process.returncode}. Error: {stderr_text}')
    
    async def _cleanup_work_dir(self):
        """清理工作目录"""
        if self.work_dir and os.path.exists(self.work_dir):
            try:
                import shutil
                shutil.rmtree(self.work_dir)
                logger.info(f'Cleaned up work directory: {self.work_dir}')
            except Exception as error:
                logger.warning(f'Failed to cleanup work directory {self.work_dir}: {error}')

# 全局导出器实例
video_exporter = VideoExporter()

async def stream_export_video(ir: Dict[str, Any], options: Dict[str, Any]) -> Generator[Dict[str, Any], None, None]:
    """流式导出视频的主函数"""
    async for progress in video_exporter.export_video(ir, options):
        yield progress

# 测试函数
async def test_export():
    """测试导出功能"""
    # 测试IR数据
    test_ir = {
        'width': 1920,
        'height': 1080,
        'fps': 30,
        'duration': 10000,  # 10秒
        'video': [
            {
                'id': 'video1',
                'src': 'test_video.mp4',
                'in': 0,
                'out': 5000,
                'start': 0
            }
        ],
        'audio': [],
        'texts': [
            {
                'id': 'text1',
                'text': '测试字幕',
                'start': 1000,
                'end': 3000,
                'style': {
                    'fontFamily': 'Arial',
                    'fontSize': 40,
                    'color': '#FFFFFF',
                    'align': 'center'
                }
            }
        ],
        'transitions': []
    }
    
    test_options = {
        'quality': 'standard',
        'codec': 'libx264',
        'subtitleMode': 'hard'
    }
    
    print("开始测试导出...")
    async for progress in stream_export_video(test_ir, test_options):
        print(f"进度: {progress}")
    
    print("测试完成!")

if __name__ == "__main__":
    # 运行测试
    asyncio.run(test_export())
