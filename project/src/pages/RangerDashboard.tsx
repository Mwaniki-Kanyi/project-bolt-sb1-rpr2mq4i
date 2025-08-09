import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Filter, MessageSquare, CheckCircle, XCircle, Edit, ArrowLeft, LogOut } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { supabase, Report } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.divIcon({
  html: `<div style="background-color: #FFB000; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [25, 25],
  iconAnchor: [12, 12],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface RangerDashboardProps {
  onBack: () => void;
}

export const RangerDashboard: React.FC<RangerDashboardProps> = ({ onBack }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const { signOut } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string, feedbackText?: string) => {
    setUpdating(true);
    try {
      const updateData: any = { status };
      if (feedbackText) {
        updateData.feedback = feedbackText;
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status, feedback: feedbackText || report.feedback }
          : report
      ));

      setSelectedReport(null);
      setShowFeedbackModal(false);
      setFeedback('');
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRangerAssigned = () => {
    setShowFeedbackModal(true);
  };

  const submitFeedback = () => {
    if (selectedReport && feedback.trim()) {
      updateReportStatus(selectedReport.id, 'ranger_assigned', feedback);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'invalid': return 'text-red-400';
      case 'updated': return 'text-blue-400';
      case 'ranger_assigned': return 'text-green-400';
      default: return 'text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Filter className="w-4 h-4" />;
      case 'invalid': return <XCircle className="w-4 h-4" />;
      case 'updated': return <Edit className="w-4 h-4" />;
      case 'ranger_assigned': return <CheckCircle className="w-4 h-4" />;
      default: return <Filter className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Ranger Dashboard</h1>
              <p className="text-white/70">Review and manage wildlife reports</p>
            </div>
          </div>
          <Button 
            onClick={async () => {
              await signOut();
              onBack(); // Redirect to UserTypeSelection
            }} 
            variant="secondary" size="sm">
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="lg:col-span-1">
            <GlassCard className="h-full">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white mb-4">Reports</h2>
                
                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {['all', 'pending', 'invalid', 'updated', 'ranger_assigned'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        filter === status
                          ? 'bg-amber-500 text-gray-900'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {status === 'all' ? 'All' : status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredReports.map((report) => (
                  <motion.div
                    key={report.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedReport?.id === report.id
                        ? 'bg-amber-500/20 border border-amber-500/30'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{report.animal_type}</span>
                      <div className={`flex items-center space-x-1 ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        <span className="text-xs capitalize">{report.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="text-white/60 text-sm">
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <GlassCard className="h-96 lg:h-full">
              <h2 className="text-xl font-semibold text-white mb-4">Reports Map</h2>
              <div className="h-80 lg:h-96 rounded-lg overflow-hidden">
                <MapContainer
                  center={[-1.2921, 36.8219]} // Nairobi
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {filteredReports.map((report) => (
                    <Marker
                      key={report.id}
                      position={[report.latitude, report.longitude]}
                    >
                      <Popup>
                        <div className="text-center">
                          <img
                            src={report.image_url}
                            alt={report.animal_type}
                            className="w-32 h-24 object-cover rounded mb-2"
                          />
                          <h3 className="font-semibold">{report.animal_type}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                          <p className={`text-sm font-medium ${getStatusColor(report.status).replace('text-', 'text-')}`}>
                            Status: {report.status.replace('_', ' ')}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Selected Report Details */}
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <GlassCard>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedReport.image_url}
                    alt={selectedReport.animal_type}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {selectedReport.animal_type}
                    </h3>
                    <div className={`flex items-center space-x-2 ${getStatusColor(selectedReport.status)}`}>
                      {getStatusIcon(selectedReport.status)}
                      <span className="capitalize">{selectedReport.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  <div className="text-white/70 space-y-2">
                    <p>Date: {new Date(selectedReport.created_at).toLocaleDateString()}</p>
                    <p>Time: {new Date(selectedReport.created_at).toLocaleTimeString()}</p>
                    <p>Location: {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}</p>
                    {selectedReport.feedback && (
                      <div>
                        <p className="text-white font-medium">Feedback:</p>
                        <p className="bg-white/10 p-2 rounded">{selectedReport.feedback}</p>
                      </div>
                    )}
                  </div>

                  {selectedReport.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => updateReportStatus(selectedReport.id, 'invalid')}
                        variant="danger"
                        size="sm"
                        loading={updating}
                      >
                        <XCircle size={16} />
                        Mark Invalid
                      </Button>
                      <Button
                        onClick={() => updateReportStatus(selectedReport.id, 'updated')}
                        variant="secondary"
                        size="sm"
                        loading={updating}
                      >
                        <Edit size={16} />
                        Mark Updated
                      </Button>
                      <Button
                        onClick={handleRangerAssigned}
                        variant="primary"
                        size="sm"
                        loading={updating}
                      >
                        <CheckCircle size={16} />
                        Assign Ranger
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard>
              <h3 className="text-xl font-semibold text-white mb-4">Add Feedback</h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your feedback for this report..."
                className="w-full h-32 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  onClick={() => setShowFeedbackModal(false)}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitFeedback}
                  variant="primary"
                  size="sm"
                  disabled={!feedback.trim()}
                  loading={updating}
                >
                  <MessageSquare size={16} />
                  Submit Feedback
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
};