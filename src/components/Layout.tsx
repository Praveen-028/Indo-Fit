import React from 'react';
import { Users, Dumbbell, UtensilsCrossed, Calendar, Bell, UserCheck, ClipboardCheck } from 'lucide-react';

interface LayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeTab, onTabChange, children }) => {
  const tabs = [
    { id: 'trainees', label: 'Trainees', icon: Users },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'diet', label: 'Diet', icon: UtensilsCrossed },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'trainers', label: 'Trainers', icon: UserCheck },
    { id: 'trainer-attendance', label: 'Trainer Attendance', icon: ClipboardCheck },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      
      {/* Header */}
      <header className="relative z-10 bg-green-800/90 backdrop-blur-md border-b border-green-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-green-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-ivory-100">INDO FIT Fitness Studio & Gym</h1>
                <p className="text-sm text-green-200">Physique LAB7.0</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="relative z-10 bg-green-800/80 backdrop-blur-md border-b border-green-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-yellow-400 text-green-900 shadow-lg'
                      : 'text-ivory-200 hover:bg-green-700/50 hover:text-ivory-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;