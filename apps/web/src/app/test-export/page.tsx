"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Play,
  Pause,
  Plus,
  Trash2,
  Download,
  Clock,
  FileVideo,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

export default function TestExportPage() {
  const [mounted, setMounted] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 确保组件只在客户端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 延迟初始化，避免服务器端渲染问题
  useEffect(() => {
    if (!mounted) return;

    // 在客户端mounted后初始化默认字幕
    if (subtitles.length === 0) {
      addSubtitle();
    }
  }, [mounted]);

  // 初始化 FFmpeg
  useEffect(() => {
    if (!mounted) return; // 只在客户端mounted后执行

    const initFFmpeg = async () => {
      try {
        // 动态导入 FFmpeg
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { fetchFile } = await import("@ffmpeg/util");

        const ffmpeg = new FFmpeg();

        // 监听进度
        ffmpeg.on("progress", ({ progress, time }) => {
          const percent = Math.min(Math.round(progress * 100), 100);
          setExportProgress(percent);
          setExportStatus(`处理进度: ${percent}%`);
        });

        await ffmpeg.load();
        setFfmpegLoaded(true);
        toast.success("FFmpeg 加载成功");
      } catch (error) {
        console.error("FFmpeg 加载失败:", error);
        toast.error("FFmpeg 加载失败，请刷新页面重试");
      }
    };

    initFFmpeg();
  }, [mounted]);

  // 处理视频文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      loadVideo(file);
      toast.success("视频文件加载成功");
    }
  };

  // 加载视频
  const loadVideo = (file: File) => {
    const url = URL.createObjectURL(file);
    if (videoRef.current) {
      videoRef.current.src = url;

      videoRef.current.addEventListener("loadedmetadata", () => {
        if (videoRef.current) {
          setVideoDuration(videoRef.current.duration);
          // 添加默认字幕
          addSubtitle();
        }
      });

      videoRef.current.addEventListener("timeupdate", () => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
        }
      });
    }
  };

  // 添加字幕
  const addSubtitle = () => {
    if (!mounted) return; // 确保只在客户端执行

    const newSubtitle: Subtitle = {
      id: Date.now(),
      startTime: subtitles.length * 5,
      endTime: (subtitles.length + 1) * 5,
      text: "请输入字幕文本",
    };
    setSubtitles([...subtitles, newSubtitle]);
  };

  // 更新字幕
  const updateSubtitle = (
    id: number,
    field: keyof Subtitle,
    value: string | number
  ) => {
    setSubtitles((prev) =>
      prev.map((sub) =>
        sub.id === id
          ? { ...sub, [field]: typeof value === "number" ? value : value }
          : sub
      )
    );
  };

  // 删除字幕
  const deleteSubtitle = (id: number) => {
    setSubtitles((prev) => prev.filter((sub) => sub.id !== id));
  };

  // 播放/暂停控制
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 跳转到指定时间
  const seekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 生成 ASS 字幕格式
  const generateASS = () => {
    let ass = `[Script Info]
Title: Subtitles
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,10,10,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

    subtitles.forEach((subtitle) => {
      const start = formatASSTime(subtitle.startTime);
      const end = formatASSTime(subtitle.endTime);
      ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${subtitle.text}\n`;
    });

    return ass;
  };

  // 格式化 ASS 时间格式
  const formatASSTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
  };

  // 导出视频
  const exportVideo = async () => {
    if (!videoFile || subtitles.length === 0) {
      toast.error("请先上传视频并添加字幕");
      return;
    }

    if (!ffmpegLoaded) {
      toast.error("FFmpeg 还在加载中，请稍后再试");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus("正在准备视频文件...");

    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile } = await import("@ffmpeg/util");

      const ffmpeg = new FFmpeg();

      // 监听进度
      ffmpeg.on("progress", ({ progress, time }) => {
        const percent = Math.min(Math.round(progress * 100), 100);
        setExportProgress(percent);
        setExportStatus(`处理进度: ${percent}%`);
      });

      await ffmpeg.load();

      // 写入视频文件到 FFmpeg 文件系统
      setExportStatus("读取视频数据...");
      const videoData = await fetchFile(videoFile);
      await ffmpeg.writeFile("input.mp4", videoData);

      // 生成 ASS 字幕文件
      setExportStatus("生成字幕文件...");
      const assContent = generateASS();
      const encoder = new TextEncoder();
      const assData = encoder.encode(assContent);
      await ffmpeg.writeFile("subtitles.ass", assData);

      // 使用 FFmpeg 合并视频和字幕
      setExportStatus("正在合并视频和字幕...");
      await ffmpeg.exec([
        "-i",
        "input.mp4",
        "-vf",
        "ass=subtitles.ass",
        "-c:a",
        "copy",
        "-preset",
        "fast",
        "output.mp4",
      ]);

      // 读取输出文件
      setExportStatus("正在生成下载文件...");
      const data = await ffmpeg.readFile("output.mp4");

      // 创建下载链接
      const blob = new Blob([data], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `video_with_subtitles_${Date.now()}.mp4`;
      a.click();

      // 清理文件系统
      await ffmpeg.deleteFile("input.mp4");
      await ffmpeg.deleteFile("subtitles.ass");
      await ffmpeg.deleteFile("output.mp4");

      setExportProgress(100);
      setExportStatus("✅ 导出成功！");
      toast.success("视频导出成功！");

      setTimeout(() => {
        setIsExporting(false);
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (error) {
      console.error("导出失败:", error);
      toast.error(
        `导出失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
      setIsExporting(false);
    }
  };

  // 获取当前显示的字幕
  const getCurrentSubtitle = () => {
    return subtitles.find(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );
  };

  // 如果还没mounted，显示加载状态
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-slate-300">正在加载页面...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
            🎬 视频字幕编辑器 - 硬字幕版
          </h1>
          <p className="text-slate-300">
            测试导出功能，支持ASS字幕格式和FFmpeg处理
          </p>
        </div>

        {/* FFmpeg 加载状态 */}
        {!ffmpegLoaded && (
          <Card className="mb-6 border-amber-200/20 bg-amber-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                <span className="text-amber-200">
                  ⏳ 正在加载 FFmpeg，首次加载可能需要 1-2 分钟...
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 文件上传区域 */}
        {ffmpegLoaded && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                上传视频文件
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-cyan-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="primary-gradient"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-lg px-8 py-4"
                >
                  📁 选择视频文件
                </Button>
                <p className="text-slate-400 mt-2">
                  支持 MP4, AVI, MOV 等常见视频格式
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 编辑器区域 */}
        {videoFile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 视频预览 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileVideo className="h-5 w-5" />
                  视频预览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black rounded-lg overflow-hidden relative">
                  <video ref={videoRef} className="w-full h-auto" controls />
                  {/* 字幕覆盖层 */}
                  {getCurrentSubtitle() && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-center min-w-[80%] backdrop-blur-sm animate-in fade-in duration-300">
                      {getCurrentSubtitle()?.text}
                    </div>
                  )}
                </div>

                {/* 播放控制 */}
                <div className="flex items-center gap-4 mt-4">
                  <Button variant="outline" size="sm" onClick={togglePlayPause}>
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {isPlaying ? "暂停" : "播放"}
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(videoDuration)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 字幕编辑 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  字幕编辑
                  <Badge variant="secondary">{subtitles.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {subtitles.map((subtitle, index) => (
                    <div
                      key={subtitle.id}
                      className="p-4 border border-slate-700 rounded-lg bg-slate-800/50"
                    >
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <Label
                            htmlFor={`start-${subtitle.id}`}
                            className="text-xs text-slate-400"
                          >
                            开始时间 (秒)
                          </Label>
                          <Input
                            id={`start-${subtitle.id}`}
                            type="number"
                            value={subtitle.startTime}
                            min={0}
                            step={0.1}
                            onChange={(e) =>
                              updateSubtitle(
                                subtitle.id,
                                "startTime",
                                parseFloat(e.target.value)
                              )
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`end-${subtitle.id}`}
                            className="text-xs text-slate-400"
                          >
                            结束时间 (秒)
                          </Label>
                          <Input
                            id={`end-${subtitle.id}`}
                            type="number"
                            value={subtitle.endTime}
                            min={0}
                            step={0.1}
                            onChange={(e) =>
                              updateSubtitle(
                                subtitle.id,
                                "endTime",
                                parseFloat(e.target.value)
                              )
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <Textarea
                        placeholder="输入字幕文本..."
                        value={subtitle.text}
                        onChange={(e) =>
                          updateSubtitle(subtitle.id, "text", e.target.value)
                        }
                        className="mb-3"
                        rows={2}
                      />
                      <div className="flex justify-between items-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSubtitle(subtitle.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          删除
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => seekToTime(subtitle.startTime)}
                        >
                          <Play className="h-4 w-4" />
                          跳转
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={addSubtitle}
                  className="w-full mt-4"
                >
                  <Plus className="h-4 w-4" />
                  添加字幕
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 时间轴 */}
        {videoFile && subtitles.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>时间轴预览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-16 bg-slate-800 rounded-lg overflow-hidden">
                {subtitles.map((subtitle) => {
                  const left = (subtitle.startTime / videoDuration) * 100;
                  const width =
                    ((subtitle.endTime - subtitle.startTime) / videoDuration) *
                    100;

                  return (
                    <div
                      key={subtitle.id}
                      className="absolute h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded cursor-pointer opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs px-2 text-center"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                      }}
                      onClick={() => seekToTime(subtitle.startTime)}
                      title={`${subtitle.text} (${formatTime(subtitle.startTime)} - ${formatTime(subtitle.endTime)})`}
                    >
                      {subtitle.text.length > 20
                        ? subtitle.text.substring(0, 20) + "..."
                        : subtitle.text}
                    </div>
                  );
                })}

                {/* 播放头 */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 transition-all duration-100"
                  style={{ left: `${(currentTime / videoDuration) * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-sm text-slate-400 mt-2">
                <span>00:00</span>
                <span>{formatTime(videoDuration)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 导出控制 */}
        {videoFile && subtitles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                导出设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  支持格式: MP4, AVI, MOV 等
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  字幕格式: ASS (高级字幕格式)
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  处理引擎: FFmpeg WebAssembly
                </div>

                <Separator />

                <Button
                  variant="primary-gradient"
                  size="lg"
                  onClick={exportVideo}
                  disabled={isExporting || !ffmpegLoaded}
                  className="w-full text-lg py-4"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      正在导出...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />🎥 导出带字幕的视频
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 导出进度 */}
        {isExporting && (
          <Card className="mt-6 border-cyan-200/20 bg-cyan-950/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                  <span className="text-cyan-200 font-medium">
                    {exportStatus}
                  </span>
                </div>

                <Progress value={exportProgress} className="h-2" />

                <div className="text-center text-sm text-cyan-300">
                  进度: {exportProgress}%
                </div>

                {exportProgress === 100 && (
                  <div className="flex items-center gap-2 text-green-400 text-center justify-center">
                    <CheckCircle className="h-5 w-5" />
                    <span>导出完成！文件已开始下载</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 使用说明 */}
        <Card className="mt-6 border-slate-700">
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="flex items-start gap-2">
              <span className="text-cyan-400">1.</span>
              <span>上传视频文件，支持常见视频格式</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400">2.</span>
              <span>添加和编辑字幕，设置开始和结束时间</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400">3.</span>
              <span>在时间轴上预览字幕位置，点击可跳转</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400">4.</span>
              <span>点击导出按钮，系统将使用FFmpeg处理视频并添加硬字幕</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400">5.</span>
              <span>处理完成后，带字幕的视频将自动下载</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
