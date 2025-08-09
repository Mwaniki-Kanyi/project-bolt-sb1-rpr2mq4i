import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Download, Send, ArrowLeft } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { analyzeAnimalImage } from '../utils/aiAnalysis';
import { generateReportPDF } from '../utils/reportGenerator';
import { supabase, Report } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { saveOfflineReport } from '../utils/offlineStorage';

interface ReportGenerationProps {
  imageFile: File;
  imageDataUrl: string;
  isAnonymous?: boolean;
  onBack: () => void;
  onComplete: () => void;
}

export const ReportGeneration: React.FC<ReportGenerationProps> = ({
  imageFile,
  imageDataUrl,
  isAnonymous = false,
  onBack,
  onComplete
}) => {
  const [analyzing, setAnalyzing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [animalType, setAnimalType] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState('');
  const [report, setReport] = useState<Report | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    const initializeReport = async () => {
      try {
        // Get location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            (error) => {
              console.error('Location error:', error);
              // Use default location if GPS fails
              setLocation({ latitude: -1.2921, longitude: 36.8219 }); // Nairobi
            }
          );
        }

        // Analyze image
        const analysis = await analyzeAnimalImage(imageFile);
        setAnimalType(analysis.animalType);
        setAnalyzing(false);
      } catch (err) {
        setError('Failed to analyze image');
        setAnalyzing(false);
      }
    };

    initializeReport();
  }, [imageFile]);

  const createReport = (): Report => {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      user_id: isAnonymous ? undefined : user?.id,
      animal_type: animalType,
      image_url: '', // Will be set after upload
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      status: 'pending',
      created_at: now,
      updated_at: now
    };
  };

  const uploadImage = async (reportId: string): Promise<string> => {
    const fileName = `${reportId}-${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('wildlife-images')
      .upload(fileName, imageFile);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('wildlife-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const submitReport = async () => {
    if (!location) {
      setError('Location is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const newReport = createReport();

      // Check if online
      if (navigator.onLine) {
        // Upload image
        const imageUrl = await uploadImage(newReport.id);
        newReport.image_url = imageUrl;

        // Save to database
        const { error: dbError } = await supabase
          .from('reports')
          .insert([newReport]);

        if (dbError) throw dbError;
      } else {
        // Save offline
        saveOfflineReport({
          tempId: newReport.id,
          user_id: newReport.user_id,
          animal_type: newReport.animal_type,
          imageDataUrl,
          latitude: newReport.latitude,
          longitude: newReport.longitude,
          status: newReport.status,
          timestamp: newReport.created_at
        });
      }

      setReport(newReport);

      // Generate and download PDF
      await generateReportPDF(newReport, imageDataUrl);

      // Complete the flow and redirect to UserTypeSelection
      onComplete(); // Immediately redirect after logic completes

    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (analyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 p-6 flex items-center justify-center">
        <GlassCard className="text-center max-w-md w-full">
          <LoadingSpinner size="lg" />
          <h2 className="text-xl font-semibold text-white mt-6 mb-2">
            Analyzing Image
          </h2>
          <p className="text-white/70">
            Our AI is identifying the wildlife in your photo...
          </p>
        </GlassCard>
      </div>
    );
  }

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
            Back
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Wildlife Report</h1>
            <p className="text-white/70">Review and submit your wildlife sighting</p>
          </div>
        </motion.div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={imageDataUrl}
                  alt="Wildlife sighting"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Animal Identified</h3>
                  <p className="text-amber-400 text-xl font-bold">{animalType}</p>
                </div>
                
                <div className="flex items-center text-white/70">
                  <Calendar size={16} className="mr-2" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center text-white/70">
                  <Clock size={16} className="mr-2" />
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
                
                {location && (
                  <div className="flex items-center text-white/70">
                    <MapPin size={16} className="mr-2" />
                    <span>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>

          {report ? (
            <GlassCard className="text-center">
              <div className="text-green-400 mb-4">
                <Check size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Report Submitted Successfully!
              </h3>
              <p className="text-white/70 mb-4">
                Your wildlife report has been {navigator.onLine ? 'submitted' : 'saved offline'} and a PDF has been downloaded to your device.
              </p>
              <p className="text-sm text-white/60">
                Report ID: {report.id}
              </p>
            </GlassCard>
          ) : (
            <div className="flex justify-center space-x-4">
              <Button
                onClick={submitReport}
                variant="primary"
                size="lg"
                loading={submitting}
                className="flex-1 max-w-xs"
              >
                <Send size={20} />
                Submit Report
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};