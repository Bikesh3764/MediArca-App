import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { X, AlertCircle } from 'lucide-react';
import { AppleButton } from '../ui/AppleButton';

interface CameraQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
  title?: string;
  subtitle?: string;
}

export const CameraQrScannerModal: React.FC<CameraQrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan QR Code',
  subtitle = 'Point camera at the clinic QR code to confirm arrival',
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser/device');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        scanFrame();
      }
    } catch (err: any) {
      setCameraError(err.message || 'Unable to access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        stopCamera();
        onScanSuccess(code.data.trim());
        onClose();
        return;
      }
    }

    animFrameId.current = requestAnimationFrame(scanFrame);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-[24px] shadow-2xl overflow-hidden border border-[#e5e5ea]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#f0f0f0]">
          <div>
            <h3 className="text-base font-bold text-[#1d1d1f]">{title}</h3>
            <p className="text-xs text-[#86868b] mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] active:scale-95 active:bg-[#e5e5ea] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="p-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Viewfinder crosshairs */}
            <div className="absolute inset-8 border-2 border-white/70 rounded-2xl pointer-events-none flex items-center justify-center shadow-lg">
              <div className="w-full h-0.5 bg-[#0066cc] animate-pulse" />
            </div>

            {/* Hint overlay */}
            <div className="absolute bottom-3 inset-x-3 text-center pointer-events-none">
              <span className="text-[11px] font-medium text-white/90 bg-black/50 backdrop-blur-xs px-3 py-1 rounded-full border border-white/20">
                Align QR Code inside frame
              </span>
            </div>

            {cameraError && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-5 text-center">
                <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                <p className="text-xs text-white mb-3 leading-relaxed">{cameraError}</p>
                <AppleButton
                  size="sm"
                  variant="primary"
                  onClick={startCamera}
                >
                  Retry Camera
                </AppleButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
