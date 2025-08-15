import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, RotateCcw, Check, X, ArrowLeft } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';

interface CameraCaptureProps {
  onCapture: (imageFile: File, imageDataUrl: string) => void;
  onBack: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onBack }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      setStream(mediaStream);
      setCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (!capturedImage) return;

    // Convert data URL to File
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'wildlife-photo.jpg', { type: 'image/jpeg' });
        onCapture(file, capturedImage);
      });
  }, [capturedImage, onCapture]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setCapturedImage(imageDataUrl);
      onCapture(file, imageDataUrl);
    };
    reader.readAsDataURL(file);
  }, [onCapture]);

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={onBack}
            className="flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back <span className="text-sm text-gray-300 ml-2">(Rudi Nyuma)</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Capture Wildlife <span className="text-sm text-gray-300 ml-2">(Piga Picha ya Wanyamapori)</span>
            </h1>
            <p className="text-white/70">
              Take a photo of the wildlife you've spotted <span className="text-sm text-gray-300 ml-2">(Piga picha ya mnyama uliyemuona)</span>
            </p>
          </div>
        </motion.div>

        <GlassCard className="text-center">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-200 text-sm mb-6">
              {error} <span className="text-sm text-gray-300 ml-2">(Hitilafu)</span>
            </div>
          )}

          {!cameraActive && !capturedImage && (
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-6">
                <Camera size={40} className="text-white" />
              </div>
              
              <div className="space-y-4">
                <Button onClick={startCamera} variant="primary" size="lg" className="w-full">
                  <Camera size={20} />
                  Open Camera <span className="text-sm text-gray-300 ml-2">(Fungua Kamera)</span>
                </Button>
                
                <div className="text-white/60">or <span className="text-sm text-gray-300 ml-2">(au)</span></div>
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  Upload from Gallery <span className="text-sm text-gray-300 ml-2">(Pakia Kutoka Kwenye Matunzio)</span>
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {cameraActive && !capturedImage && (
            <div className="space-y-6">
              <div className="relative rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover bg-black"
                />
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={stopCamera} variant="secondary">
                  <X size={20} />
                  Cancel <span className="text-sm text-gray-300 ml-2">(Ghairi)</span>
                </Button>
                <Button onClick={capturePhoto} variant="primary" size="lg">
                  <Camera size={20} />
                  Capture <span className="text-sm text-gray-300 ml-2">(Piga Picha)</span>
                </Button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="space-y-6">
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured wildlife"
                  className="w-full h-64 object-cover"
                />
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={retakePhoto} variant="secondary">
                  <RotateCcw size={20} />
                  Retake <span className="text-sm text-gray-300 ml-2">(Piga Tena)</span>
                </Button>
                <Button onClick={confirmPhoto} variant="primary" size="lg">
                  <Check size={20} />
                  Confirm <span className="text-sm text-gray-300 ml-2">(Thibitisha)</span>
                </Button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </GlassCard>
      </div>
    </div>
  );
};