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
  RotateCcw,
  Users,
  ArchiveRestore
} from 'lucide-react';

import { useTrainees } from '../hooks/useTrainees';
import { TraineeForm } from './TraineeForm';
import { formatDistanceToNow } from 'date-fns';

export const TraineeList: React.FC = () => {
  const { trainees, archivedTrainees, loading, archiveTrainee, unarchiveTrainee, deleteTrainee } = useTrainees();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Filter trainees based on search term and active tab
  const filteredTrainees = (activeTab === 'active' ? trainees : archivedTrainees).filter(trainee =>
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

  const handleUnarchive = async (traineeId: string) => {
    try {
      await unarchiveTrainee(traineeId);
      setActiveDropdown(null);
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

  const handleGenerateInvoice = async (trainee: any) => {
    try {
      // Generate invoice number
      const invoiceNo = `INV-${trainee.uniqueId}-${Date.now().toString().slice(-6)}`;
      
      // Create comprehensive WhatsApp invoice message
      const message = `🧾 *INVOICE - INDOFIT GYM*
*Physique LAB7.0*

━━━━━━━━━━━━━━━━━━━━━━━

📋 *Invoice Details:*
• Invoice No: ${invoiceNo}
• Date: ${new Date().toLocaleDateString()}

👤 *Member Information:*
• Name: ${trainee.name}
• Member ID: ${trainee.uniqueId}
• Phone: ${trainee.phoneNumber}

💪 *Membership Details:*
• Admission Date: ${trainee.membershipStartDate.toLocaleDateString()}
• Duration: ${trainee.membershipDuration} month(s)
• Expires: ${trainee.membershipEndDate.toLocaleDateString()}
• Goal: ${trainee.goalCategory}
• Special Training: ${trainee.specialTraining ? 'Yes' : 'No'}
• Payment Type: ${trainee.paymentType}

💰 *Amount Details:*
• Total Amount: *₹${trainee.admissionFee}*

━━━━━━━━━━━━━━━━━━━━━━━

✅ *Payment Status: PAID*

Thank you for choosing INDOFIT GYM! 🙏
Keep pushing your limits! 💪

*Contact us:* [Your gym contact details]`;
      
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
          <h1 className="text-2xl sm:text-3xl font-bold text-ivory-100">Trainees</h1>
          <p className="text-green-200 mt-1">
            {activeTab === 'active' 
              ? `${trainees.length} active members` 
              : `${archivedTrainees.length} archived members`
            }
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg text-sm sm:text-base"
        >
          <Plus className="w-5 h-5" />
          <span>Add Trainee</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-1">
        <button
          onClick={() => {
            setActiveTab('active');
            setSearchTerm('');
            setActiveDropdown(null);
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
            activeTab === 'active'
              ? 'bg-yellow-500 text-white shadow-sm'
              : 'text-ivory-200 hover:text-ivory-100 hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active ({trainees.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('archived');
            setSearchTerm('');
            setActiveDropdown(null);
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
            activeTab === 'archived'
              ? 'bg-yellow-500 text-white shadow-sm'
              : 'text-ivory-200 hover:text-ivory-100 hover:bg-white/5'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Archived ({archivedTrainees.length})</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={`Search ${activeTab} trainees...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-ivory-100 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-sm sm:text-base"
        />
      </div>

      {/* Trainees Grid */}
      {filteredTrainees.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
            {activeTab === 'active' ? (
              <Plus className="w-8 h-8 text-green-400" />
            ) : (
              <Archive className="w-8 h-8 text-green-400" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-ivory-100 mb-2">
            {searchTerm 
              ? `No ${activeTab} trainees found` 
              : activeTab === 'active' 
                ? 'No active trainees' 
                : 'No archived trainees'
            }
          </h3>
          <p className="text-green-200 mb-6">
            {searchTerm 
              ? 'Try a different search term.' 
              : activeTab === 'active'
                ? 'Get started by adding your first trainee.'
                : 'Archived trainees will appear here.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrainees.map((trainee) => {
            const expiryStatus = getExpiryStatus(new Date(trainee.membershipEndDate));
            
            return (
              <div
                key={trainee.id}
                className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 group ${
                  activeTab === 'archived' ? 'opacity-75' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-ivory-100 group-hover:text-yellow-400 transition-colors">
                      {trainee.name}
                      {activeTab === 'archived' && (
                        <span className="ml-2 text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full">
                          Archived
                        </span>
                      )}
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
                        {activeTab === 'active' ? (
                          <>
                            <button
                              onClick={() => handleGenerateInvoice(trainee)}
                              className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Invoice</span>
                            </button>
                            <button
                              onClick={() => handleArchive(trainee.id)}
                              className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Archive className="w-4 h-4" />
                              <span>Archive</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleUnarchive(trainee.id)}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-xs sm:text-sm text-blue-600 hover:bg-blue-50"
                          >
                            <ArchiveRestore className="w-4 h-4" />
                            <span>Unarchive</span>
                          </button>
                        )}
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

                {/* Status Badge - Only show for active trainees */}
                {activeTab === 'active' && (
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                      {expiryStatus.text}
                    </span>
                  </div>
                )}

                {/* Archived Badge */}
                {activeTab === 'archived' && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Archive className="w-3 h-3 mr-1" />
                      Archived
                    </span>
                  </div>
                )}

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
                    <span className="text-green-200">
                      {activeTab === 'active' ? 'Expires:' : 'Expired:'}
                    </span>
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