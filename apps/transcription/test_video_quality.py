#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试视频质量脚本
用于验证导出的视频是否正常
"""

import os
import asyncio
import tempfile
import subprocess
from video_export_api import VideoExporter

async def test_video_export():
    """测试视频导出功能"""
    print("🎬 开始测试视频导出质量...")
    
    # 创建测试IR数据
    test_ir = {
        'width': 1280,
        'height': 720,
        'fps': 30,
        'duration': 3000,  # 3秒
        'video': [
            {
                'id': 'test_video_1',
                'src': 'test_input.mp4',  # 会被替换为测试视频
                'in': 0,
                'out': 3000,
                'start': 0
            }
        ],
        'audio': [],
        'texts': [
            {
                'id': 'test_text_1',
                'text': '测试视频质量',
                'start': 500,
                'end': 2500,
                'style': {
                    'fontFamily': 'Arial',
                    'fontSize': 48,
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
    
    exporter = VideoExporter()
    
    try:
        print("📊 开始导出测试...")
        async for progress in exporter.export_video(test_ir, test_options):
            print(f"进度: {progress.get('type', 'unknown')} - {progress.get('message', '')}")
            
            if progress.get('type') == 'complete':
                output_path = progress.get('output_path')
                work_dir = progress.get('work_dir')
                
                if output_path and os.path.exists(output_path):
                    file_size = os.path.getsize(output_path)
                    print(f"✅ 导出完成!")
                    print(f"📁 输出文件: {output_path}")
                    print(f"📊 文件大小: {file_size} bytes ({file_size/1024/1024:.2f} MB)")
                    
                    # 使用ffprobe检查视频信息
                    await check_video_info(output_path)
                    
                    return output_path
                else:
                    print("❌ 输出文件不存在")
                    return None
            elif progress.get('type') == 'error':
                print(f"❌ 导出失败: {progress.get('message')}")
                return None
    
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return None

async def check_video_info(video_path: str):
    """检查视频信息"""
    print(f"\n🔍 检查视频信息: {video_path}")
    
    try:
        # 使用ffprobe获取视频信息
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            video_path
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode == 0:
            import json
            info = json.loads(stdout.decode())
            
            print("📺 视频流信息:")
            for stream in info.get('streams', []):
                if stream.get('codec_type') == 'video':
                    print(f"   编码器: {stream.get('codec_name')}")
                    print(f"   分辨率: {stream.get('width')}x{stream.get('height')}")
                    print(f"   帧率: {stream.get('r_frame_rate')}")
                    print(f"   像素格式: {stream.get('pix_fmt')}")
                    print(f"   时长: {stream.get('duration')}秒")
                elif stream.get('codec_type') == 'audio':
                    print(f"   音频编码器: {stream.get('codec_name')}")
                    print(f"   采样率: {stream.get('sample_rate')}")
            
            format_info = info.get('format', {})
            print(f"📊 总时长: {format_info.get('duration')}秒")
            print(f"📊 比特率: {format_info.get('bit_rate')} bps")
            
        else:
            stderr_text = stderr.decode('utf-8', errors='ignore')
            print(f"❌ ffprobe失败: {stderr_text}")
            
    except Exception as e:
        print(f"❌ 检查视频信息失败: {e}")

def create_test_video_simple():
    """创建一个简单的测试视频"""
    print("🎨 创建测试用的输入视频...")
    
    output_path = "/tmp/test_input.mp4"
    
    cmd = [
        'ffmpeg',
        '-f', 'lavfi',
        '-i', 'testsrc2=duration=3:size=1280x720:rate=30',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '23',
        '-y',
        output_path
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ 测试输入视频创建成功: {output_path}")
            return output_path
        else:
            print(f"❌ 创建测试视频失败: {result.stderr}")
            return None
    except Exception as e:
        print(f"❌ 创建测试视频异常: {e}")
        return None

async def main():
    """主函数"""
    print("🚀 开始视频质量测试...")
    
    # 创建测试输入视频
    test_input = create_test_video_simple()
    if not test_input:
        print("❌ 无法创建测试输入视频，退出测试")
        return
    
    # 测试导出
    result = await test_video_export()
    
    if result:
        print(f"\n🎉 测试完成! 输出文件: {result}")
        print("💡 请手动播放输出文件检查视频质量")
    else:
        print("\n❌ 测试失败!")
    
    # 清理测试文件
    if test_input and os.path.exists(test_input):
        os.remove(test_input)
        print(f"🧹 清理测试文件: {test_input}")

if __name__ == "__main__":
    asyncio.run(main())
