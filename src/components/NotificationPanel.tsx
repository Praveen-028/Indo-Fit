import React from 'react';
import { Bell, MessageCircle, Calendar, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { format } from 'date-fns';

export const NotificationPanel: React.FC = () => {
  const { expiringMemberships, hasNotifications, sendWhatsAppMessage } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
          <Bell className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ivory-100">Notifications</h1>
          <p className="text-green-200 mt-1">Membership expiry alerts</p>
        </div>
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
                        <span>Expires: {format(membership.expiryDate, 'PPP')}</span>
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
  );
};