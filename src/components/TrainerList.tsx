import React, { useState } from 'react';
import { Plus, Search, Phone, Archive, Trash2, MoreVertical, FileText, RotateCcw, CreditCard as Edit, UserCheck } from 'lucide-react';

import { useTrainers } from '../hooks/useTrainers';
import { TrainerForm } from './TrainerForm';
import { Trainer } from '../types';

type TrainerView = 'active' | 'archived';

export const TrainerList: React.FC = () => {
  const { 
    trainers,
    archivedTrainers,
    loading, 
    archiveTrainer, 
    unarchiveTrainer,
    deleteTrainer 
  } = useTrainers();

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<TrainerView>('active');
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);

  // Determine which list to filter based on the current view
  const listToFilter = currentView === 'active' ? trainers : archivedTrainers;

  // Filter trainers based on search term
  const filteredTrainers = listToFilter.filter(trainer =>
    trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.phoneNumber.includes(searchTerm) ||
    trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleArchive = async (trainerId: string) => {
    try {
      await archiveTrainer(trainerId);
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error archiving trainer:', error);
    }
  };

  const handleUnarchive = async (trainerId: string) => {
    try {
      await unarchiveTrainer(trainerId);
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error unarchiving trainer:', error);
    }
  };

  const handleDelete = async (trainerId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this trainer?')) {
      try {
        await deleteTrainer(trainerId);
        setActiveDropdown(null);
      } catch (error) {
        console.error('Error deleting trainer:', error);
      }
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setShowForm(true);
    setActiveDropdown(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTrainer(null);
  };

  const handleGenerateContract = async (trainer: Trainer) => {
    try {
      const contractMessage = `📋 *TRAINER CONTRACT - INDOFIT GYM*
*Physique LAB7.0*

━━━━━━━━━━━━━━━━━━━━━━━

👨‍💼 *Trainer Information:*
• Name: ${trainer.name}
• Trainer ID: ${trainer.uniqueId}
• Phone: ${trainer.phoneNumber}
• Email: ${trainer.email || 'Not provided'}

💼 *Employment Details:*
• Joining Date: ${new Date(trainer.joiningDate).toLocaleDateString()}
• Specialization: ${trainer.specialization}
• Experience: ${trainer.experience} year(s)
• Monthly Salary: ₹${trainer.salary}

━━━━━━━━━━━━━━━━━━━━━━━

✅ *Status: ACTIVE TRAINER*

Welcome to the INDOFIT GYM family! 💪

*Contact us:* [Your gym contact details]`;
      
      const phoneNumber = trainer.phoneNumber.replace(/[^\d]/g, '');
      const whatsappNumber = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
      const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(contractMessage)}`;
      
      window.open(whatsappURL, '_blank');
      setActiveDropdown(null);
      
      alert(`Contract details ready! WhatsApp will open to send complete contract information to ${trainer.name}.`);
      
    } catch (error) {
      console.error('Error generating contract:', error);
      alert('Error generating contract. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-ivory-200">Loading trainers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ivory-100">
            {currentView === 'active' ? 'Active Trainers' : 'Archived Trainers'}
          </h1>
          <p className="text-green-200 mt-1">
            {currentView === 'active' 
              ? `${trainers.length} active trainers`
              : `${archivedTrainers.length} archived trainers`}
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className={`flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg transition-all shadow-lg text-sm sm:text-base 
            ${currentView === 'archived' ? 'opacity-50 cursor-not-allowed' : 'hover:from-yellow-600 hover:to-yellow-700'}`}
          disabled={currentView === 'archived'}
        >
          <Plus className="w-5 h-5" />
          <span>Add Trainer</span>
        </button>
      </div>

      {/* View Toggle and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* View Toggle Buttons */}
        <div className="flex space-x-2 p-1 bg-white/10 rounded-lg border border-white/20 flex-shrink-0">
          <button
            onClick={() => {
              setCurrentView('active');
              setSearchTerm('');
            }}
            className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              currentView === 'active' 
                ? 'bg-yellow-500 text-white shadow-md' 
                : 'text-ivory-200 hover:bg-white/5'
            }`}
          >
            Active ({trainers.length})
          </button>
          <button
            onClick={() => {
              setCurrentView('archived');
              setSearchTerm('');
            }}
            className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              currentView === 'archived' 
                ? 'bg-yellow-500 text-white shadow-md' 
                : 'text-ivory-200 hover:bg-white/5'
            }`}
          >
            Archived ({archivedTrainers.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${currentView} trainers by name, phone, or specialization...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-ivory-100 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Trainers Grid */}
      {filteredTrainers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
            {currentView === 'active' ? (
              <Plus className="w-8 h-8 text-green-400" />
            ) : (
              <Archive className="w-8 h-8 text-green-400" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-ivory-100 mb-2">
            {searchTerm ? 'No matches found' : `No ${currentView} trainers`}
          </h3>
          <p className="text-green-200 mb-6">
            {searchTerm ? 'Try a different search term.' : `No trainers are currently in the ${currentView} list.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrainers.map((trainer) => (
            <div
              key={trainer.id}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-ivory-100 group-hover:text-yellow-400 transition-colors">
                    {trainer.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-green-200 mt-1">
                    <Phone className="w-4 h-4" />
                    <span>{trainer.phoneNumber}</span>
                  </div>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === trainer.id ? null : trainer.id)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-ivory-200" />
                  </button>
                  
                  {activeDropdown === trainer.id && (
                    <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg py-2 z-10 min-w-[160px]">
                      
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEdit(trainer)}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      
                      {/* Contract */}
                      <button
                        onClick={() => handleGenerateContract(trainer)}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Contract</span>
                      </button>
                      
                      {currentView === 'active' ? (
                        <button
                          onClick={() => handleArchive(trainer.id)}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Archive className="w-4 h-4" />
                          <span>Archive</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnarchive(trainer.id)}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Unarchive</span>
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(trainer.id)}
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
                {currentView === 'active' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <UserCheck className="w-3 h-3 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-400 text-gray-800">
                    Archived
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3">
                                
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-green-200">Experience:</span>
                  <span className="text-ivory-100 font-medium">{trainer.experience} years</span>
                </div>
                
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-green-200">Salary:</span>
                  <span className="text-ivory-100 font-medium">₹{trainer.salary}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-green-200">Joined:</span>
                  <span className="text-ivory-100 font-medium">
                    {new Date(trainer.joiningDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TrainerForm 
        isOpen={showForm} 
        onClose={handleCloseForm}
        editingTrainer={editingTrainer} 
      />
    </div>
  );
};