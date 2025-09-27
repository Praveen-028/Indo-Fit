import React, { useState } from 'react';
import { Bell, MessageCircle, Calendar, AlertTriangle, Plus, X, Send } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationPanel: React.FC = () => {
  const { expiringMemberships, hasNotifications, sendWhatsAppMessage } = useNotifications();
  const [showDialog, setShowDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');

  const handleSendCustomMessage = () => {
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    const greeting = customerName.trim() ? `Hai ${customerName.trim()}` : 'Hai';
    const message = `${greeting} 🌟 Hello! This is Kesavan from INDO FIT Fitness Studio – Team Physique Lab 7.0 💪🔥

On 26/09/2025, you had enquired with us about starting your fitness journey, and I’d love to share what we offer to help you reach your goals 🚀

🏋️ Our Services

✅ Strength Training
✅ Sports Conditioning
✅ Fat Loss / Weight Loss Programs
✅ General Fitness & Wellness
✅ Stability Programs
✅ Injury Prevention
✅ Weekly Physiotherapist Visit
✅ Weekly Outdoor & Sports Activities
✅ Pre-book Ice Bath 🧊 (₹500)
✅ Certified & Experienced Trainers

📍 Location: Behind Zudio
📞 Feel free to call me or visit anytime to know more or to kickstart your transformation journey!

🙏 Thank you for your interest.
Let’s achieve your fitness goals together with INDO FIT Fitness Studio 💯🔥

— V.K. KESAVAN 
FITNESS AND LIFESTYLE COACH`;

    // Open WhatsApp with the message
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    // Reset form and close dialog
    setPhoneNumber('');
    setCustomerName('');
    setShowDialog(false);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ivory-100">Notifications</h1>
              <p className="text-green-200 mt-1">Membership expiry alerts</p>
            </div>
          </div>
          
          {/* Custom Message Button */}
          <button
            onClick={() => setShowDialog(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Send Custom Message</span>
            <span className="sm:hidden">Custom</span>
          </button>
        </div>

        {!hasNotifications ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-ivory-100 mb-2">No notifications</h3>
            <p className="text-green-200">All memberships are up to date!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h3 className="text-base sm:text-lg font-semibold text-ivory-100">Expiring Memberships</h3>
              </div>
              <p className="text-yellow-200 text-xs sm:text-sm">
                {expiringMemberships.length} membership(s) expiring within the next 4 days
              </p>
            </div>

            <div className="grid gap-4">
              {expiringMemberships.map((membership) => (
                <div
                  key={membership.traineeId}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 sm:p-6 hover:bg-white/15 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-base sm:text-lg font-semibold text-ivory-100 mb-2">
                        {membership.traineeName}
                      </h4>
                      
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center space-x-2 text-green-200">
                          <Calendar className="w-4 h-4" />
                          <span>Expires: {new Date(membership.expiryDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                        </div>
                        
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          membership.daysUntilExpiry === 0
                            ? 'bg-red-100 text-red-800'
                            : membership.daysUntilExpiry <= 2
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {membership.daysUntilExpiry === 0
                            ? 'Expires Today'
                            : `${membership.daysUntilExpiry} day${membership.daysUntilExpiry === 1 ? '' : 's'} left`}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => sendWhatsAppMessage(membership)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-ivory-100">Send Custom Message</h3>
              <button
                onClick={() => setShowDialog(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number (e.g., 919876543210)"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-ivory-100 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                />
                <p className="text-xs text-gray-400 mt-1">Include country code (e.g., 91 for India)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-ivory-100 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCustomMessage}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};