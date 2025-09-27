import React, { useState } from 'react';
import { Users, Dumbbell, UtensilsCrossed, Calendar, Bell, UserCheck, ClipboardCheck, Menu, X } from 'lucide-react';

interface LayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeTab, onTabChange, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const tabs = [
    { id: 'trainees', label: 'Trainees', icon: Users },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'diet', label: 'Diet', icon: UtensilsCrossed },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'trainers', label: 'Trainers', icon: UserCheck },
    { id: 'trainer-attendance', label: 'Trainer Attendance', icon: ClipboardCheck },
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      
      {/* Header */}
      <header className="relative z-10 bg-green-800/90 backdrop-blur-md border-b border-green-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title - Responsive */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Dumbbell className="w-4 h-4 sm:w-6 sm:h-6 text-green-900" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-xl font-bold text-white truncate">INDO FIT Fitness Studio & Gym</h1>
                <p className="text-xs sm:text-sm text-green-200 hidden sm:block">Team of Physique LAB7.0</p>
              </div>
            </div>
            
            {/* Coach Information - Hidden on small screens */}
            <div className="text-right hidden md:block flex-shrink-0">
              <h2 className="text-lg font-bold text-white">V.K. KESAVAN</h2>
              <p className="text-sm text-green-200">FITNESS AND LIFESTYLE COACH</p>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-green-700/50 transition-colors ml-2"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {/* Coach info for mobile - shown below main header */}
          <div className="md:hidden pb-3 text-center border-t border-green-700/30 mt-3 pt-3">
            <h2 className="text-base font-bold text-white">V.K. KESAVAN</h2>
            <p className="text-xs text-green-200">FITNESS AND LIFESTYLE COACH</p>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="relative z-10 bg-green-800/80 backdrop-blur-md border-b border-green-700/30 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-yellow-400 text-green-900 shadow-lg'
                      : 'text-white hover:bg-green-700/50 hover:text-white'
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

      {/* Mobile Navigation - Slide out menu */}
      <div className={`md:hidden fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
        
        {/* Menu Panel */}
        <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-green-800/95 backdrop-blur-md shadow-xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Navigation</h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-white hover:bg-green-700/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left ${
                      activeTab === tab.id
                        ? 'bg-yellow-400 text-green-900 shadow-lg'
                        : 'text-white hover:bg-green-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile (Alternative approach - commented out) */}
      {/* 
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-green-800/95 backdrop-blur-md border-t border-green-700/50 z-40">
        <div className="flex justify-around py-2">
          {tabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-yellow-400'
                    : 'text-white hover:text-yellow-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      */}

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="w-full">
          {children}
        </div>
      </main>

      {/* Mobile overlay when menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;