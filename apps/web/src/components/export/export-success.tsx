'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Maximize2 } from 'lucide-react';

interface ExportSuccessProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName?: string;
  videoCover?: string;
  onDownload?: () => void;
}

export function ExportSuccess({
  open,
  onOpenChange,
  fileName = 'video.mp4',
  videoCover,
  onDownload
}: ExportSuccessProps) {
  const handleDownload = () => {
    onDownload?.();
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Download</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="p-1 rounded-md hover:bg-gray-700 transition-colors"
              >
                <Maximize2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Video Cover */}
            {videoCover && (
              <div className="mb-6">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-600">
                  <img
                    src={videoCover}
                    alt="Video Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className="text-center">
              {/* Success Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {/* Success Message */}
              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-semibold text-white">Export Successful</h3>
                <p className="text-sm text-gray-300">
                  You can download the video to your device.
                </p>
              </div>
              
              {/* Download Button */}
              <Button
                onClick={handleDownload}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-base font-medium rounded-lg"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 