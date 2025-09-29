import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import Layout from './components/Layout';
import { TraineeList } from './components/TraineeList';
import { NotificationPanel } from './components/NotificationPanel';
import { AttendanceManager } from './components/AttendanceManager';
import { WorkoutPlanner } from './components/WorkoutPlanner';
import { DietPlanner } from './components/DietPlanner';
import { TrainerList } from './components/TrainerList';
import { TrainerAttendanceManager } from './components/TrainerAttendanceManager';

function App() {
  const [activeTab, setActiveTab] = useState('trainees');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Monitor authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User authenticated:', user.uid);
        setIsAuthenticated(true);
      } else {
        console.log('User not authenticated');
        setIsAuthenticated(false);
      }
      setAuthLoading(false);
    });

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    return () => unsubscribe();
  }, []);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-2xl font-bold text-green-900">IF</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">INDO FIT</h1>
          <p className="text-green-200 mb-4">Initializing...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show authentication error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-white">!</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Authentication Required</h1>
          <p className="text-red-200 mb-4">Unable to authenticate with Firebase. Please check your connection and try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  const renderContent = () => {
    switch (activeTab) {
      case 'trainees':
        return <TraineeList />;
      case 'notifications':
        return <NotificationPanel />;
      case 'attendance':
        return <AttendanceManager />;
      case 'workout':
        return <WorkoutPlanner />;
      case 'diet':
        return <DietPlanner />;
      case 'trainers':
        return <TrainerList />;
      case 'trainer-attendance':
        return <TrainerAttendanceManager />;
      default:
        return <TraineeList />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;