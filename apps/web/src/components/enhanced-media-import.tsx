"use client";

import React, { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, AlertCircle, CheckCircle, FolderOpen, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  useMediaStore, 
  type ImportProgress, 
  type BatchImportResult,
  SUPPORTED_FORMATS 
} from "@/stores/media-store";
import { useProjectStore } from "@/stores/project-store";
import { cn } from "@/lib/utils";

interface EnhancedMediaImportProps {
  className?: string;
  onImportComplete?: (result: BatchImportResult) => void;
  maxFiles?: number;
  showProgress?: boolean;
  compact?: boolean;
}

// 文件状态类型
type FileStatus = 'pending' | 'processing' | 'success' | 'error' | 'duplicate';

interface FileImportStatus {
  file: File;
  status: FileStatus;
  error?: string;
  progress?: number;
}

export function EnhancedMediaImport({
  className,
  onImportComplete,
  maxFiles = 100,
  showProgress = true,
  compact = false
}: EnhancedMediaImportProps) {
  const { activeProject } = useProjectStore();
  const { 
    batchImportFiles, 
    importFromDataTransfer, 
    validateFileFormat,
    isImporting, 
    importProgress, 
    cancelImport,
    clearImportProgress 
  } = useMediaStore();

  const [fileStatuses, setFileStatuses] = useState<FileImportStatus[]>([]);
  const [dragDepth, setDragDepth] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件导入
  const handleImport = useCallback(async (files: File[]) => {
    if (!activeProject) {
      return;
    }

    // 限制文件数量
    if (files.length > maxFiles) {
      alert(`最多只能同时导入 ${maxFiles} 个文件`);
      return;
    }

    // 初始化文件状态
    const initialStatuses: FileImportStatus[] = files.map(file => ({
      file,
      status: 'pending' as FileStatus
    }));
    setFileStatuses(initialStatuses);
    setShowDetails(true);

    // 开始导入
    try {
      const result = await batchImportFiles(
        activeProject.id,
        files,
        (progress: ImportProgress) => {
          // 更新当前处理文件的状态
          setFileStatuses(prev => prev.map(status => ({
            ...status,
            status: status.file.name === progress.currentFileName ? 'processing' : status.status,
            progress: status.file.name === progress.currentFileName ? progress.percentage : status.progress
          })));
        }
      );

      // 更新最终状态
      setFileStatuses(prev => prev.map(status => {
        const successful = result.successful.find(item => item.file === status.file);
        const failed = result.failed.find(item => item.file === status.file);
        const isDuplicate = result.duplicates.includes(status.file.name);

        if (successful) {
          return { ...status, status: 'success' as FileStatus };
        } else if (failed) {
          return { ...status, status: 'error' as FileStatus, error: failed.error };
        } else if (isDuplicate) {
          return { ...status, status: 'duplicate' as FileStatus };
        }
        return status;
      }));

      onImportComplete?.(result);

    } catch (error) {
      console.error('Import failed:', error);
      setFileStatuses(prev => prev.map(status => ({
        ...status,
        status: 'error' as FileStatus,
        error: error instanceof Error ? error.message : '导入失败'
      })));
    }
  }, [activeProject, batchImportFiles, maxFiles, onImportComplete]);

  // 处理拖拽导入
  const handleDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[], event: any) => {
    // 优先处理 DataTransfer（支持文件夹）
    if (event.dataTransfer && activeProject) {
      try {
        const result = await importFromDataTransfer(
          activeProject.id,
          event.dataTransfer,
          (progress: ImportProgress) => {
            setFileStatuses(prev => prev.map(status => ({
              ...status,
              status: status.file.name === progress.currentFileName ? 'processing' : status.status,
              progress: status.file.name === progress.currentFileName ? progress.percentage : status.progress
            })));
          }
        );
        onImportComplete?.(result);
      } catch (error) {
        console.error('Drag import failed:', error);
      }
    } else if (acceptedFiles.length > 0) {
      await handleImport(acceptedFiles);
    }
  }, [activeProject, importFromDataTransfer, onImportComplete, handleImport]);

  // 配置拖拽区域
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    onDragEnter: () => setDragDepth(prev => prev + 1),
    onDragLeave: () => setDragDepth(prev => prev - 1),
    maxFiles,
    disabled: isImporting,
    validator: (file) => {
      const validation = validateFileFormat(file);
      return validation.isValid ? null : { code: 'invalid-type', message: validation.error || '不支持的文件格式' };
    }
  });

  // 手动选择文件
  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 处理文件输入变化
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      handleImport(files);
    }
    // 清空input以允许重复选择相同文件
    event.target.value = '';
  }, [handleImport]);

  // 取消导入
  const handleCancel = useCallback(() => {
    cancelImport();
    setFileStatuses([]);
    setShowDetails(false);
  }, [cancelImport]);

  // 清除结果
  const handleClearResults = useCallback(() => {
    clearImportProgress();
    setFileStatuses([]);
    setShowDetails(false);
  }, [clearImportProgress]);

  // 获取状态颜色
  const getStatusColor = (status: FileStatus) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'duplicate': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'processing': return <div className="w-4 h-4 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  // 获取支持格式的显示文本
  const getSupportedFormatsText = () => {
    const allFormats = [
      ...SUPPORTED_FORMATS.video,
      ...SUPPORTED_FORMATS.audio,
      ...SUPPORTED_FORMATS.image
    ];
    return allFormats.join(', ');
  };

  if (compact) {
    return (
      <div className={cn("space-y-4", className)}>
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive || dragDepth > 0
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400",
            isImporting && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">
            {isDragActive ? "松开即可导入文件" : "拖拽文件到此处或点击选择"}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleFileSelect}
            disabled={isImporting}
          >
            选择文件
          </Button>
        </div>

        {showProgress && importProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>导入进度: {importProgress.current}/{importProgress.total}</span>
              <span>{importProgress.percentage}%</span>
            </div>
            <Progress value={importProgress.percentage} />
            {importProgress.currentFileName && (
              <p className="text-xs text-gray-500 truncate">
                正在处理: {importProgress.currentFileName}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          媒体文件导入
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 拖拽区域 */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
            isDragActive || dragDepth > 0
              ? "border-blue-500 bg-blue-50 scale-105"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
            isImporting && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="space-y-4">
            {isDragActive ? (
              <div className="space-y-2">
                <FolderOpen className="w-12 h-12 mx-auto text-blue-500" />
                <p className="text-lg font-medium text-blue-700">
                  松开即可导入文件
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <p className="text-lg font-medium text-gray-700">
                  拖拽文件或文件夹到此处
                </p>
                <p className="text-sm text-gray-500">
                  支持批量导入，最多 {maxFiles} 个文件
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <Button 
                onClick={handleFileSelect}
                disabled={isImporting}
                size="lg"
              >
                选择文件
              </Button>
              <Button 
                variant="outline" 
                onClick={handleFileSelect}
                disabled={isImporting}
                size="lg"
              >
                选择文件夹
              </Button>
            </div>
          </div>
        </div>

        {/* 支持格式说明 */}
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>支持的文件格式：</strong></p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">视频: {SUPPORTED_FORMATS.video.join(', ')}</Badge>
                <Badge variant="secondary" className="text-xs">音频: {SUPPORTED_FORMATS.audio.join(', ')}</Badge>
                <Badge variant="secondary" className="text-xs">图片: {SUPPORTED_FORMATS.image.join(', ')}</Badge>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* 导入进度 */}
        {showProgress && importProgress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">导入进度</h4>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {importProgress.current}/{importProgress.total}
                </Badge>
                <Badge variant="outline">
                  {importProgress.percentage}%
                </Badge>
              </div>
            </div>
            
            <Progress value={importProgress.percentage} className="h-2" />
            
            {importProgress.currentFileName && (
              <p className="text-sm text-gray-600 truncate">
                <span className="font-medium">当前:</span> {importProgress.currentFileName}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Badge variant={importProgress.status === 'error' ? 'destructive' : 'default'}>
                {importProgress.status === 'processing' && '处理中'}
                {importProgress.status === 'completed' && '已完成'}
                {importProgress.status === 'error' && '出错'}
              </Badge>
              
              {isImporting && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancel}
                >
                  取消导入
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 文件导入详情 */}
        {showDetails && fileStatuses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">导入详情</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearResults}
              >
                <X className="w-4 h-4 mr-1" />
                清除
              </Button>
            </div>
            
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {fileStatuses.map((fileStatus, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg border">
                    <div className="flex-shrink-0">
                      {getStatusIcon(fileStatus.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {fileStatus.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {fileStatus.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {fileStatus.error}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Badge className={getStatusColor(fileStatus.status)}>
                        {fileStatus.status === 'pending' && '等待中'}
                        {fileStatus.status === 'processing' && '处理中'}
                        {fileStatus.status === 'success' && '成功'}
                        {fileStatus.status === 'error' && '失败'}
                        {fileStatus.status === 'duplicate' && '重复'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <Separator />
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>总计: {fileStatuses.length} 个文件</span>
              <div className="flex gap-4">
                <span className="text-green-600">
                  成功: {fileStatuses.filter(s => s.status === 'success').length}
                </span>
                <span className="text-red-600">
                  失败: {fileStatuses.filter(s => s.status === 'error').length}
                </span>
                <span className="text-yellow-600">
                  重复: {fileStatuses.filter(s => s.status === 'duplicate').length}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 