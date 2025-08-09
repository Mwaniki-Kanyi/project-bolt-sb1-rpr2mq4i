import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Trash2, Users, FileText, MapPin, TrendingUp, ArrowLeft, LogOut } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { supabase, Report, UserProfile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';

let DefaultIcon = L.divIcon({
  html: `<div style="background-color: #FFB000; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [25, 25],
  iconAnchor: [12, 12],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface AdminDashboardProps {
  onBack: () => void;
}

interface AnalyticsData {
  totalReports: number;
  totalUsers: number;
  reportsByStatus: { name: string; value: number; color: string }[];
  reportsByAnimal: { name: string; count: number }[];
  recentActivity: Report[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'reports' | 'users'>('overview');

  const { signOut } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setReports(reportsData || []);
      setUsers(usersData || []);

      // Generate analytics
      generateAnalytics(reportsData || [], usersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalytics = (reportsData: Report[], usersData: UserProfile[]) => {
    // Reports by status
    const statusCounts = reportsData.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const reportsByStatus = [
      { name: 'Pending', value: statusCounts.pending || 0, color: '#FFB000' },
      { name: 'Invalid', value: statusCounts.invalid || 0, color: '#EF4444' },
      { name: 'Updated', value: statusCounts.updated || 0, color: '#3B82F6' },
      { name: 'Ranger Assigned', value: statusCounts.ranger_assigned || 0, color: '#10B981' },
    ];

    // Reports by animal type
    const animalCounts = reportsData.reduce((acc, report) => {
      acc[report.animal_type] = (acc[report.animal_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const reportsByAnimal = Object.entries(animalCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setAnalytics({
      totalReports: reportsData.length,
      totalUsers: usersData.length,
      reportsByStatus,
      reportsByAnimal,
      recentActivity: reportsData.slice(0, 5),
    });
  };

  const deleteReport = async (reportId: string) => {
    setDeleting(reportId);
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.filter(report => report.id !== reportId));
      
      // Regenerate analytics
      const updatedReports = reports.filter(report => report.id !== reportId);
      generateAnalytics(updatedReports, users);
    } catch (error) {
      console.error('Error deleting report:', error);
    } finally {
      setDeleting(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setDeleting(userId);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== userId));
      
      // Regenerate analytics
      const updatedUsers = users.filter(user => user.id !== userId);
      generateAnalytics(reports, updatedUsers);
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'invalid': return 'text-red-400';
      case 'updated': return 'text-blue-400';
      case 'ranger_assigned': return 'text-green-400';
      default: return 'text-white';
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
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-white/70">System analytics and management</p>
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
        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'reports', label: 'Reports', icon: FileText },
            { id: 'users', label: 'Users', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-amber-500 text-gray-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && analytics && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlassCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Total Reports</p>
                    <p className="text-2xl font-bold text-white">{analytics.totalReports}</p>
                  </div>
                  <FileText className="text-amber-500" size={32} />
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{analytics.totalUsers}</p>
                  </div>
                  <Users className="text-amber-500" size={32} />
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Pending Reports</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.reportsByStatus.find(s => s.name === 'Pending')?.value || 0}
                    </p>
                  </div>
                  <MapPin className="text-yellow-400" size={32} />
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.reportsByStatus.find(s => s.name === 'Ranger Assigned')?.value || 0}
                    </p>
                  </div>
                  <TrendingUp className="text-green-400" size={32} />
                </div>
              </GlassCard>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reports by Status */}
              <GlassCard>
                <h3 className="text-xl font-semibold text-white mb-4">Reports by Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.reportsByStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {analytics.reportsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Reports by Animal Type */}
              <GlassCard>
                <h3 className="text-xl font-semibold text-white mb-4">Top Animals Reported</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.reportsByAnimal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: 'white', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fill: 'white' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="#FFB000" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            {/* Map */}
            <GlassCard>
              <h3 className="text-xl font-semibold text-white mb-4">Reports Map</h3>
              <div className="h-96 rounded-lg overflow-hidden">
                <MapContainer
                  center={[-1.2921, 36.8219]} // Nairobi
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {reports.map((report) => (
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
        )}

        {/* Reports Tab */}
        {selectedTab === 'reports' && (
          <GlassCard>
            <h3 className="text-xl font-semibold text-white mb-4">All Reports</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-3">Image</th>
                    <th className="text-left p-3">Animal</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Location</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b border-white/10">
                      <td className="p-3">
                        <img
                          src={report.image_url}
                          alt={report.animal_type}
                          className="w-16 h-12 object-cover rounded"
                        />
                      </td>
                      <td className="p-3">{report.animal_type}</td>
                      <td className="p-3">
                        <span className={`capitalize ${getStatusColor(report.status)}`}>
                          {report.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">{new Date(report.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                      </td>
                      <td className="p-3">
                        <Button
                          onClick={() => deleteReport(report.id)}
                          variant="danger"
                          size="sm"
                          loading={deleting === report.id}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <GlassCard>
            <h3 className="text-xl font-semibold text-white mb-4">All Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">User Type</th>
                    <th className="text-left p-3">Joined</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/10">
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">
                        <span className="capitalize bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full text-sm">
                          {user.user_type}
                        </span>
                      </td>
                      <td className="p-3">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Button
                          onClick={() => deleteUser(user.id)}
                          variant="danger"
                          size="sm"
                          loading={deleting === user.id}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};