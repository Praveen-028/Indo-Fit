import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  Archive, 
  Trash2, 
  MoreVertical, 
  FileText, 
  RotateCcw, // Used for Unarchive
  Edit, // NEW: Added Edit icon
  User, // NEW: Added for trainer display
  Hash, // NEW: Added for serial number
  MessageCircle, // NEW: Added for motivational quotes
  Heart // NEW: Added for motivation icon
} from 'lucide-react';

import { useTrainees } from '../hooks/useTrainees';
import { useTrainers } from '../hooks/useTrainers'; // NEW: Import trainers hook
import { TraineeForm } from './TraineeForm';
import { Trainee } from '../types'; // NEW: Import Trainee type

// Type for view mode
type TraineeView = 'active' | 'archived';

export const TraineeList: React.FC = () => {
  const { 
    trainees, // Now only active trainees
    archivedTrainees, // NEW: Archived list
    loading, 
    archiveTrainee, 
    unarchiveTrainee, // NEW: Unarchive function
    deleteTrainee 
  } = useTrainees();

  const { trainers } = useTrainers(); // NEW: Get trainers data

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<TraineeView>('active'); // State for view mode
  const [editingTrainee, setEditingTrainee] = useState<Trainee | null>(null); // NEW: State for editing trainee

  // NEW: Motivational quotes array
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

  // Determine which list to filter based on the current view
  const listToFilter = currentView === 'active' ? trainees : archivedTrainees;

  // Filter trainees based on search term
  const filteredTrainees = listToFilter.filter(trainee =>
    trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainee.phoneNumber.includes(searchTerm)
  );

  // NEW: Helper function to get trainer name by ID
  const getTrainerName = (trainerId: string) => {
    const trainer = trainers.find(t => t.id === trainerId);
    return trainer ? trainer.name : 'Unknown Trainer';
  };

  const handleArchive = async (traineeId: string) => {
    try {
      await archiveTrainee(traineeId);
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error archiving trainee:', error);
    }
  };

  // NEW: Handler for Unarchive
  const handleUnarchive = async (traineeId: string) => {
    try {
      await unarchiveTrainee(traineeId);
      setActiveDropdown(null);
      // Optional: switch back to active view after unarchive
      // setCurrentView('active');
    } catch (error) {
      console.error('Error unarchiving trainee:', error);
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

  // NEW: Handler for Edit
  const handleEdit = (trainee: Trainee) => {
    setEditingTrainee(trainee);
    setShowForm(true);
    setActiveDropdown(null);
  };

  // NEW: Handler for closing form (resets editing state)
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTrainee(null);
  };

  // NEW: Handler for sending motivational quote
  const handleSendMotivationalQuote = async (trainee: Trainee) => {
    try {
      // Get a random motivational quote
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      
      // Create personalized motivational message
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

      // Create WhatsApp URL with the message
      const phoneNumber = trainee.phoneNumber.replace(/[^\d]/g, ''); // Remove non-digits
      const whatsappNumber = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
      const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp in a new tab
      window.open(whatsappURL, '_blank');
      
      setActiveDropdown(null);
      
      // Show success message
      alert(`Motivational message ready! WhatsApp will open to send encouragement to ${trainee.name} 💪`);
      
    } catch (error) {
      console.error('Error sending motivational quote:', error);
      alert('Error preparing motivational message. Please try again.');
    }
  };

  const handleGenerateInvoice = async (trainee: any) => {
    try {
      // Generate invoice number
      const invoiceNo = `INV-${trainee.uniqueId}-${Date.now().toString().slice(-6)}`;
      
      // Create comprehensive WhatsApp invoice message
      const message = `🧾 *INVOICE - INDOFIT GYM*
*Physique LAB7.0*

━━━━━━━━━━━━━━━━━━━━━━━

🎉 *Welcome on board to INDOFIT!*  
Your transformation journey starts here, and we'll be with you at every step 💪🔥

📋 *Invoice Details:*
• Invoice No: ${invoiceNo}
• Date: ${new Date().toLocaleDateString()}

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

      
      // Create WhatsApp URL with the message
      const phoneNumber = trainee.phoneNumber.replace(/[^\d]/g, ''); // Remove non-digits
      const whatsappNumber = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
      const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp in a new tab
      window.open(whatsappURL, '_blank');
      
      setActiveDropdown(null);
      
      // Show success message
      alert(`Invoice details ready! WhatsApp will open to send complete invoice information to ${trainee.name}.`);
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
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
          // Disable Add button in archived view
          className={`flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg transition-all shadow-lg text-sm sm:text-base 
            ${currentView === 'archived' ? 'opacity-50 cursor-not-allowed' : 'hover:from-yellow-600 hover:to-yellow-700'}`}
          disabled={currentView === 'archived'}
        >
          <Plus className="w-5 h-5" />
          <span>Add Trainee</span>
        </button>
      </div>

      {/* NEW: View Toggle and Search */}
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

        {/* Search Input */}
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
          {filteredTrainees.map((trainee, index) => {
            const expiryStatus = getExpiryStatus(new Date(trainee.membershipEndDate));
            
            return (
              <div
                key={trainee.id}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 group">
                {/* NEW: Serial Number Badge */}

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
                    {/* NEW: Member ID Display */}
                    <div className="flex items-center space-x-2 text-xs text-green-300 mt-1">
                      <Hash className="w-3 h-3" />
                      <span>{trainee.memberId || trainee.uniqueId}</span>
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
                      <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg py-2 z-10 min-w-[180px]">
                        
                        {/* NEW: Edit Button */}
                        <button
                          onClick={() => handleEdit(trainee)}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        
                        {/* Invoice */}
                        <button
                          onClick={() => handleGenerateInvoice(trainee)}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Invoice</span>
                        </button>
                        
                        {currentView === 'active' ? (
                          // Active View Actions
                          <button
                            onClick={() => handleArchive(trainee.id)}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Archive className="w-4 h-4" />
                            <span>Archive</span>
                          </button>
                        ) : (
                          // Archived View Actions
                          <>
                            {/* NEW: Send Motivational Quote Button - Only for archived trainees */}
                            <button
                              onClick={() => handleSendMotivationalQuote(trainee)}
                              className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-green-600 hover:bg-green-50"
                            >
                              <Heart className="w-4 h-4" />
                              <span>Send Motivation</span>
                            </button>

                            <button
                              onClick={() => handleUnarchive(trainee.id)}
                              className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Unarchive</span>
                            </button>
                          </>
                        )}

                        {/* Delete */}
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

                  {/* NEW: Display Assigned Trainer if Special Training is enabled */}
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

      {/* UPDATED: Pass editingTrainee to TraineeForm */}
      <TraineeForm 
        isOpen={showForm} 
        onClose={handleCloseForm}
        editingTrainee={editingTrainee} 
      />
    </div>
  );
};