import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  Calendar, 
  Target, 
  Archive, 
  Trash2, 
  CreditCard as Edit, 
  MoreVertical, 
  FileText, 
  RotateCcw 
} from 'lucide-react';

import { useTrainees } from '../hooks/useTrainees';
import { TraineeForm } from './TraineeForm';
import { formatDistanceToNow } from 'date-fns';

export const TraineeList: React.FC = () => {
  const { trainees, loading, archiveTrainee, deleteTrainee } = useTrainees();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const filteredTrainees = trainees.filter(trainee =>
    trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainee.phoneNumber.includes(searchTerm)
  );

  const handleArchive = async (traineeId: string) => {
    try {
      await archiveTrainee(traineeId);
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error archiving trainee:', error);
    }
  };

  const handleDelete = async (traineeId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this trainee?')) {
      try {
        await deleteTrainee(traineeId);
        setActiveDropdown(null);
      } catch (error) {
        console.error('Error deleting trainee:', error);
      }
    }
  };

  const getExpiryStatus = (endDate: Date) => {
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', color: 'bg-red-100 text-red-800', text: 'Expired' };
    if (diffDays <= 3) return { status: 'expiring', color: 'bg-yellow-100 text-yellow-800', text: `${diffDays} days left` };
    return { status: 'active', color: 'bg-green-100 text-green-800', text: `${diffDays} days left` };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-ivory-200">Loading trainees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ivory-100">Trainees</h1>
          <p className="text-green-200 mt-1">{trainees.length} active members</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg text-sm sm:text-base"
        >
          <Plus className="w-5 h-5" />
          <span>Add Trainee</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search trainees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-ivory-100 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-sm sm:text-base"
        />
      </div>

      {/* Trainees Grid */}
      {filteredTrainees.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-ivory-100 mb-2">No trainees found</h3>
          <p className="text-green-200 mb-6">
            {searchTerm ? 'Try a different search term.' : 'Get started by adding your first trainee.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrainees.map((trainee) => {
            const expiryStatus = getExpiryStatus(new Date(trainee.membershipEndDate));
            
            return (
              <div
                key={trainee.id}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-ivory-100 group-hover:text-yellow-400 transition-colors">
                      {trainee.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-green-200 mt-1">
                      <Phone className="w-4 h-4" />
                      <span>{trainee.phoneNumber}</span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === trainee.id ? null : trainee.id)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-ivory-200" />
                    </button>
                    
                    {activeDropdown === trainee.id && (
                      <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg py-2 z-10 min-w-[160px]">
                        <button
                          onClick={() => handleArchive(trainee.id)}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Archive className="w-4 h-4" />
                          <span>Archive</span>
                        </button>
                        <button
                          onClick={() => handleDelete(trainee.id)}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                    {expiryStatus.text}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-green-200">Duration:</span>
                    <span className="text-ivory-100 font-medium">{trainee.membershipDuration} months</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-green-200">Goal:</span>
                    <span className="text-ivory-100 font-medium">{trainee.goalCategory}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-green-200">Special Training:</span>
                    <span className={`font-medium ${trainee.specialTraining ? 'text-yellow-400' : 'text-ivory-100'}`}>
                      {trainee.specialTraining ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-green-200">Expires:</span>
                    <span className="text-ivory-100 font-medium">
                      {new Date(trainee.membershipEndDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TraineeForm isOpen={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
};