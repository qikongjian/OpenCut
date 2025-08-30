#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频数据处理器
处理前端传来的base64视频数据，保存为临时文件
文件路径: apps/transcription/video_data_handler.py
"""

import os
import base64
import tempfile
import logging
from typing import Dict, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class VideoDataHandler:
    """视频数据处理器"""
    
    def __init__(self):
        self.work_dir: Optional[str] = None
        self.file_mapping: Dict[str, str] = {}  # blobId -> local_path
    
    def set_work_dir(self, work_dir: str):
        """设置工作目录"""
        self.work_dir = work_dir
        self.file_mapping.clear()
    
    def save_base64_video(self, blob_id: str, base64_data: str) -> str:
        """将base64视频数据保存为临时文件"""
        if not self.work_dir:
            raise Exception("工作目录未设置")
        
        try:
            # 解码base64数据
            video_data = base64.b64decode(base64_data)
            
            # 生成本地文件路径
            local_filename = f"video_{blob_id}.mp4"
            local_path = os.path.join(self.work_dir, local_filename)
            
            # 保存文件
            with open(local_path, 'wb') as f:
                f.write(video_data)
            
            # 记录映射关系
            self.file_mapping[blob_id] = local_path
            
            file_size = os.path.getsize(local_path)
            logger.info(f'✅ 保存blob视频成功: {blob_id} -> {local_path} ({file_size} bytes)')
            
            return local_path
            
        except Exception as e:
            logger.error(f'❌ 保存blob视频失败: {blob_id}, 错误: {e}')
            raise Exception(f"保存视频文件失败: {str(e)}")
    
    def process_video_files(self, video_files: Dict[str, str]) -> Dict[str, str]:
        """处理所有视频文件，返回blob_id到本地路径的映射"""
        if not video_files:
            logger.info("没有视频文件需要处理")
            return {}
        
        logger.info(f"🚀 开始处理{len(video_files)}个视频文件...")
        
        file_mapping = {}
        for blob_id, base64_data in video_files.items():
            try:
                local_path = self.save_base64_video(blob_id, base64_data)
                file_mapping[blob_id] = local_path
            except Exception as e:
                logger.error(f"处理视频文件失败: {blob_id}, 错误: {e}")
                # 继续处理其他文件，不要因为一个文件失败就停止
                continue
        
        logger.info(f"🎉 视频文件处理完成，成功处理{len(file_mapping)}/{len(video_files)}个文件")
        return file_mapping
    
    def resolve_blob_urls(self, ir: Dict, video_files: Optional[Dict[str, str]] = None) -> Dict:
        """解析IR中的blob URL，替换为本地文件路径"""
        if not ir.get('video') or not video_files:
            logger.info("没有需要解析的视频源")
            return ir
        
        # 处理视频文件
        file_mapping = self.process_video_files(video_files)
        
        if not file_mapping:
            logger.warning("没有成功处理任何视频文件")
            return ir
        
        # 复制IR数据
        resolved_ir = ir.copy()
        resolved_videos = []
        
        for video in ir['video']:
            resolved_video = video.copy()
            src = video.get('src', '')
            
            if src.startswith('blob:'):
                # 从blob URL中提取blob ID
                blob_id = src.split('/')[-1]
                
                if blob_id in file_mapping:
                    resolved_video['src'] = file_mapping[blob_id]
                    logger.info(f'✅ 解析视频源: {src} -> {file_mapping[blob_id]}')
                else:
                    logger.warning(f'⚠️ 无法解析视频源: {src} (blob_id: {blob_id})')
            
            resolved_videos.append(resolved_video)
        
        resolved_ir['video'] = resolved_videos
        logger.info(f"🎉 IR解析完成，共处理{len(resolved_videos)}个视频元素")
        
        return resolved_ir

# 全局视频数据处理器实例
video_data_handler = VideoDataHandler()
