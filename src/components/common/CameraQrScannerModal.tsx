import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { X, Camera, Keyboard, AlertCircle } from 'lucide-react';
import { AppleButton } from '../ui/AppleButton';
import { AppleInput } from '../ui/AppleInput';

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
  title = 'Scan Clinic Standee',
  subtitle = 'Point camera at the QR standee in the clinic lobby',
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualCode('');
      setCameraError(null);
      return;
    }

    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    setScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this device');
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
      setActiveTab('manual');
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
        return;
      }
    }

    animFrameId.current = requestAnimationFrame(scanFrame);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    stopCamera();
    onScanSuccess(manualCode.trim());
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

        {/* Tab switcher: Camera vs Manual Code */}
        <div className="flex p-1 bg-[#f5f5f7] mx-4 mt-3 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-95 ${
              activeTab === 'camera'
                ? 'bg-white text-[#1d1d1f]'
                : 'text-[#86868b]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Camera
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-95 ${
              activeTab === 'manual'
                ? 'bg-white text-[#1d1d1f]'
                : 'text-[#86868b]'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" /> Enter Code
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {activeTab === 'camera' ? (
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
              <div className="absolute inset-8 border border-white/60 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-[#0066cc] animate-pulse" />
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                  <p className="text-xs text-white mb-3">{cameraError}</p>
                  <AppleButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveTab('manual')}
                  >
                    Enter Code Instead
                  </AppleButton>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
              <AppleInput
                label="Clinic Check-In Code"
                placeholder="e.g. CLN-8821 or 6-digit code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                autoFocus
              />
              <AppleButton
                variant="primary"
                size="md"
                className="w-full"
                type="submit"
                disabled={!manualCode.trim()}
              >
                Submit Check-In
              </AppleButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
