import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SplashScreen } from './pages/SplashScreen';
import { UserTypeSelection } from './pages/UserTypeSelection';
import { AuthPage } from './pages/AuthPage';
import { CameraCapture } from './pages/CameraCapture';
import { ReportGeneration } from './pages/ReportGeneration';
import { RangerDashboard } from './pages/RangerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { useAuth } from './contexts/AuthContext';

type AppState = 
  | 'splash'
  | 'userSelection'
  | 'auth'
  | 'camera'
  | 'report'
  | 'rangerDashboard'
  | 'adminDashboard'
  | 'complete';

interface CapturedImage {
  file: File;
  dataUrl: string;
}

function AppContent() {
  const [currentState, setCurrentState] = useState<AppState>('splash');
  const [selectedUserType, setSelectedUserType] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  
  const { user, profile, loading } = useAuth();

  // Handle authentication state changes
  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect authenticated users to their appropriate dashboard
      if (profile.user_type === 'ranger') {
        setCurrentState('rangerDashboard');
      } else if (profile.user_type === 'admin') {
        setCurrentState('adminDashboard');
      } else if (profile.user_type === 'community') {
        setCurrentState('camera');
      }
    }
  }, [user, profile, loading]);

  const handleSplashComplete = () => {
    setCurrentState('userSelection');
  };

  const handleUserTypeSelection = (userType: string) => {
    setSelectedUserType(userType);
    
    if (userType === 'anonymous') {
      setCurrentState('camera');
    } else {
      setCurrentState('auth');
    }
  };

  const handleAuthComplete = () => {
    // Auth completion is handled by the useEffect above
  };

  const handleImageCapture = (file: File, dataUrl: string) => {
    setCapturedImage({ file, dataUrl });
    setCurrentState('report');
  };

  const handleReportComplete = () => {
    setCurrentState('complete');
    // Reset after 3 seconds
    setTimeout(() => {
      setCurrentState('userSelection');
      setCapturedImage(null);
      setSelectedUserType('');
    }, 3000);
  };

  const handleBackToUserSelection = () => {
    setCurrentState('userSelection');
    setSelectedUserType('');
    setCapturedImage(null);
  };

  const handleBackToCamera = () => {
    setCurrentState('camera');
    setCapturedImage(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  switch (currentState) {
    case 'splash':
      return <SplashScreen onComplete={handleSplashComplete} />;
    
    case 'userSelection':
      return <UserTypeSelection onSelectUserType={handleUserTypeSelection} />;
    
    case 'auth':
      return (
        <AuthPage
          userType={selectedUserType}
          onBack={handleBackToUserSelection}
        />
      );
    
    case 'camera':
      return (
        <CameraCapture
          onCapture={handleImageCapture}
          onBack={handleBackToUserSelection}
        />
      );
    
    case 'report':
      return capturedImage ? (
        <ReportGeneration
          imageFile={capturedImage.file}
          imageDataUrl={capturedImage.dataUrl}
          isAnonymous={selectedUserType === 'anonymous'}
          onBack={handleBackToCamera}
          onComplete={handleReportComplete}
        />
      ) : null;
    
    case 'rangerDashboard':
      return <RangerDashboard onBack={handleBackToUserSelection} />;
    
    case 'adminDashboard':
      return <AdminDashboard onBack={handleBackToUserSelection} />;
    
    case 'complete':
      return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-white/70">Your contribution helps protect wildlife.</p>
          </div>
        </div>
      );
    
    default:
      return <UserTypeSelection onSelectUserType={handleUserTypeSelection} />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;