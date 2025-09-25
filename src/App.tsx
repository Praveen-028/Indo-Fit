import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { TraineeList } from './components/TraineeList';
import { NotificationPanel } from './components/NotificationPanel';
import { AttendanceManager } from './components/AttendanceManager';
import { WorkoutPlanner } from './components/WorkoutPlanner';
import { DietPlanner } from './components/DietPlanner';

function App() {
  const [activeTab, setActiveTab] = useState('trainees');

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