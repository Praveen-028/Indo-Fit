import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  Archive, 
  Trash2, 
  MoreVertical, 
  FileText, 
  RotateCcw,
  Edit,
  User,
  Hash,
  MessageCircle,
  Heart,
  AlertCircle
} from 'lucide-react';

import { useTrainees } from '../hooks/useTrainees';
import { useTrainers } from '../hooks/useTrainers';
import { TraineeForm } from './TraineeForm';
import { Trainee } from '../types';

type TraineeView = 'active' | 'archived';

export const TraineeList: React.FC = () => {
  const { 
    trainees,
    archivedTrainees,
    loading, 
    archiveTrainee, 
    unarchiveTrainee,
    deleteTrainee 
  } = useTrainees();

  const { trainers } = useTrainers();

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<TraineeView>('active');
  const [editingTrainee, setEditingTrainee] = useState<Trainee | null>(null);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Motivational quotes array
  const motivationalQuotes = [
    "💪 Your fitness journey is waiting for you! Every day is a new chance to become stronger. Come back to INDOFIT and let's continue your transformation! 🔥",
    "🌟 Champions are made when nobody's watching. Your gym family at INDOFIT misses you! Ready to get back to your goals? 💯",
    "🚀 The best project you'll ever work on is YOU! We're here to support your comeback journey at INDOFIT. Let's do this together! 💪",
    "⚡ Your body can do it. It's time to convince your mind! INDOFIT is ready to welcome you back to achieve your fitness dreams! 🏆",
    "🔥 Success isn't given. It's earned in the gym, in the grind, in every rep! Miss training with us? Let's restart your fitness story at INDOFIT! 💪",
    "🌈 Every workout is a step towards a better you! Your INDOFIT family is waiting to celebrate your return. Ready to make it happen? 🎯",
    "💎 Diamonds are formed under pressure, and champions are forged in the gym! Come back to INDOFIT and shine bright! ✨",
    "🎯 Your goals are still waiting for you! Let's turn your 'I wish' into 'I will' and your 'Someday' into 'Today' at INDOFIT! 🚀"
  ];

  // Memoized trainer name lookup
  const getTrainerName = useCallback((trainerId: string) => {
    const trainer = trainers.find(t => t.id === trainerId);
    return trainer ? trainer.name : 'Unknown Trainer';
  }, [trainers]);

  // Memoized filtered trainees
  const { listToFilter, filteredTrainees } = useMemo(() => {
    const listToFilter = currentView === 'active' ? trainees : archivedTrainees;
    const filtered = listToFilter.filter(trainee =>
      trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.phoneNumber.includes(searchTerm)
    );
    return { listToFilter, filteredTrainees: filtered };
  }, [currentView, trainees, archivedTrainees, searchTerm]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown]')) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeDropdown]);

  // Error auto-clear
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleOperationError = (operation: string, error: any) => {
    console.error(`Error ${operation}:`, error);
    setError(`Failed to ${operation}. Please try again.`);
    setOperationLoading(null);
  };

  const handleArchive = async (traineeId: string) => {
    setOperationLoading(`archive-${traineeId}`);
    try {
      await archiveTrainee(traineeId);
      setActiveDropdown(null);
    } catch (error) {
      handleOperationError('archive trainee', error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleUnarchive = async (traineeId: string) => {
    setOperationLoading(`unarchive-${traineeId}`);
    try {
      await unarchiveTrainee(traineeId);
      setActiveDropdown(null);
    } catch (error) {
      handleOperationError('unarchive trainee', error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (traineeId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this trainee?')) {
      return;
    }
    
    setOperationLoading(`delete-${traineeId}`);
    try {
      await deleteTrainee(traineeId);
      setActiveDropdown(null);
    } catch (error) {
      handleOperationError('delete trainee', error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleEdit = (trainee: Trainee) => {
    setEditingTrainee(trainee);
    setShowForm(true);
    setActiveDropdown(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTrainee(null);
  };

  // Improved phone number formatting
  const formatPhoneForWhatsApp = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/[^\d]/g, '');
    // Handle various country codes, defaulting to India
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      return `91${cleaned.slice(1)}`;
    }
    return cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  };

  const handleSendMotivationalQuote = async (trainee: Trainee) => {
    setOperationLoading(`motivation-${trainee.id}`);
    try {
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      
      const message = `Hi ${trainee.name}! 👋

Winners not born; They are made💪

🏋️‍♂️ *Why come back to INDOFIT?*
✅ State-of-the-art equipment
✅ Expert trainers & personalized guidance  
✅ Supportive community that cheers you on
✅ Flexible membership plans
✅ Your previous progress is still here!

💬 *Ready to restart your fitness journey?*
Reply to this message or call us to discuss your comeback plan!

🎯 Remember: *"The best time to plant a tree was 20 years ago. The second best time is NOW!"*

Let's make your fitness goals a reality! 💪

*Team INDOFIT Fitness Studio and Gym - Physique LAB7.0*
📍 Location: Behind Zudio
Contact us : 6383328828`;

      const whatsappNumber = formatPhoneForWhatsApp(trainee.phoneNumber);
      const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappURL, '_blank');
      setActiveDropdown(null);
      
    } catch (error) {
      handleOperationError('send motivational message', error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleGenerateInvoice = async (trainee: Trainee) => {
    setOperationLoading(`invoice-${trainee.id}`);
    try {
      const invoiceNo = `INV-${trainee.uniqueId}-${Date.now().toString().slice(-6)}`;
      
      // Use the trainee's invoice date if available, otherwise use current date
      const invoiceDate = trainee.invoiceDate ? new Date(trainee.invoiceDate) : new Date();
      
      const message = `🧾 *INVOICE - INDOFIT Fitness Studio & Gym*
*Physique LAB7.0*

━━━━━━━━━━━━━━━━━━━━━━━

🎉 *Welcome on board to INDOFIT!*  
Your transformation journey starts here, and we'll be with you at every step 💪🔥

📋 *Invoice Details:*
• Invoice No: ${invoiceNo}
• Date: ${invoiceDate.toLocaleDateString()}

👤 *Member Information:*
• Name: ${trainee.name}
• Member ID: ${trainee.uniqueId}
• Phone: ${trainee.phoneNumber}

💪 *Membership Details:*
• Admission Date: ${new Date(trainee.membershipStartDate).toLocaleDateString()}
• Duration: ${trainee.membershipDuration} month(s)
• Expires: ${new Date(trainee.membershipEndDate).toLocaleDateString()}
• Goal: ${trainee.goalCategory}
• Special Training: ${trainee.specialTraining ? 'Yes' : 'No'}
• Payment Type: ${trainee.paymentType}

💰 *Amount Details:*
• Total Amount: *₹${trainee.admissionFee}*

━━━━━━━━━━━━━━━━━━━━━━━

✅ *Payment Status: PAID*

Thank you for choosing *INDOFIT GYM*! 🙏  
Together, let's achieve your fitness goals and push past limits! 🚀💯

📍 Location: Behind Zudio

*Contact us:* 6383328828`;

      const whatsappNumber = formatPhoneForWhatsApp(trainee.phoneNumber);
      const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappURL, '_blank');
      setActiveDropdown(null);
      
    } catch (error) {
      handleOperationError('generate invoice', error);
    } finally {
      setOperationLoading(null);
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
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ivory-100">
            {currentView === 'active' ? 'Active Trainees' : 'Archived Trainees'}
          </h1>
          <p className="text-green-200 mt-1">
            {currentView === 'active' 
              ? `${trainees.length} active members`
              : `${archivedTrainees.length} archived members`}
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className={`flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg transition-all shadow-lg text-sm sm:text-base 
            ${currentView === 'archived' ? 'opacity-50 cursor-not-allowed' : 'hover:from-yellow-600 hover:to-yellow-700'}`}
          disabled={currentView === 'archived'}
        >
          <Plus className="w-5 h-5" />
          <span>Add Trainee</span>
        </button>
      </div>

      {/* View Toggle and Search */}
      <div className="flex flex-col md:flex-row gap-4">
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
            Active ({trainees.length})
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
            Archived ({archivedTrainees.length})
          </button>
        </div>

        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${currentView} trainees by name or phone...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-ivory-100 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Trainees Grid */}
      {filteredTrainees.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
            {currentView === 'active' ? (
              <Plus className="w-8 h-8 text-green-400" />
            ) : (
              <Archive className="w-8 h-8 text-green-400" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-ivory-100 mb-2">
            {searchTerm ? 'No matches found' : `No ${currentView} trainees`}
          </h3>
          <p className="text-green-200 mb-6">
            {searchTerm ? 'Try a different search term.' : `No members are currently in the ${currentView} list.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrainees.map((trainee) => {
            const expiryStatus = getExpiryStatus(new Date(trainee.membershipEndDate));
            const isOperationLoading = operationLoading?.includes(trainee.id);
            
            return (
              <div
                key={trainee.id}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 group">
                
                {/* Header */}
                <div className="flex items-start justify-between mb-4 relative">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-ivory-100 group-hover:text-yellow-400 transition-colors">
                      {trainee.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-green-200 mt-1">
                      <Phone className="w-4 h-4" />
                      <span>{trainee.phoneNumber}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-green-300 mt-1">
                      <Hash className="w-3 h-3" />
                      <span>{trainee.memberId || trainee.uniqueId}</span>
                    </div>
                  </div>
                  
                  <div className="relative" data-dropdown>
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === trainee.id ? null : trainee.id)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                      disabled={isOperationLoading}
                    >
                      <MoreVertical className="w-4 h-4 text-ivory-200" />
                    </button>
                    
                    {activeDropdown === trainee.id && (
                      <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg py-2 z-10 min-w-[180px]">
                        
                        <button
                          onClick={() => handleEdit(trainee)}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        
                        <button
                          onClick={() => handleGenerateInvoice(trainee)}
                          disabled={operationLoading === `invoice-${trainee.id}`}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{operationLoading === `invoice-${trainee.id}` ? 'Generating...' : 'Invoice'}</span>
                        </button>
                        
                        {currentView === 'active' ? (
                          <button
                            onClick={() => handleArchive(trainee.id)}
                            disabled={operationLoading === `archive-${trainee.id}`}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Archive className="w-4 h-4" />
                            <span>{operationLoading === `archive-${trainee.id}` ? 'Archiving...' : 'Archive'}</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSendMotivationalQuote(trainee)}
                              disabled={operationLoading === `motivation-${trainee.id}`}
                              className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
                            >
                              <Heart className="w-4 h-4" />
                              <span>{operationLoading === `motivation-${trainee.id}` ? 'Sending...' : 'Send Motivation'}</span>
                            </button>

                            <button
                              onClick={() => handleUnarchive(trainee.id)}
                              disabled={operationLoading === `unarchive-${trainee.id}`}
                              className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>{operationLoading === `unarchive-${trainee.id}` ? 'Unarchiving...' : 'Unarchive'}</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(trainee.id)}
                          disabled={operationLoading === `delete-${trainee.id}`}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{operationLoading === `delete-${trainee.id}` ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  {currentView === 'active' ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                      {expiryStatus.text}
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

                  {trainee.specialTraining && trainee.assignedTrainerId && (
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-green-200 flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>Trainer:</span>
                      </span>
                      <span className="text-yellow-400 font-medium">
                        {getTrainerName(trainee.assignedTrainerId)}
                      </span>
                    </div>
                  )}
                  
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

      <TraineeForm 
        isOpen={showForm} 
        onClose={handleCloseForm}
        editingTrainee={editingTrainee} 
      />
    </div>
  );
};