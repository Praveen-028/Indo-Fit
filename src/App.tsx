import React, { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Monitor authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.uid || 'No user');
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
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
  }, []);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-2xl font-black text-green-900">IF</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">INDO FIT</h1>
          <p className="text-green-200 mb-4">Physique LAB7.0</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-green-300 mt-4">Initializing system...</p>
        </div>
      </div>
    );
  }

  // Show error screen if authentication fails
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-black text-red-900">!</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">System Error</h1>
          <p className="text-red-200 mb-6">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
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