import React, { useState } from 'react';
import { X, FileText, Calendar } from 'lucide-react';
import { Trainee } from '../types';

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trainee: Trainee | null;
}

export const InvoiceDialog: React.FC<InvoiceDialogProps> = ({
  isOpen,
  onClose,
  trainee
}) => {
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/[^\d]/g, '');
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      return `91${cleaned.slice(1)}`;
    }
    return cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  };

  const handleGenerateInvoice = async () => {
    if (!trainee) return;

    setLoading(true);
    try {
      const invoiceNo = `INV-${trainee.uniqueId}-${Date.now().toString().slice(-6)}`;
      const selectedDate = new Date(invoiceDate);
      
      const message = `🧾 *INVOICE - INDOFIT Fitness Studio & Gym*
*Physique LAB7.0*

━━━━━━━━━━━━━━━━━━━━━━━

🎉 *Welcome on board to INDOFIT!*  
Your transformation journey starts here, and we'll be with you at every step 💪🔥

📋 *Invoice Details:*
• Invoice No: ${invoiceNo}
• Date: ${selectedDate.toLocaleDateString()}

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
      onClose();
      
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !trainee) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-white">Generate Invoice</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Member Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Member Details</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Name:</span> {trainee.name}</p>
                <p><span className="font-medium">Member ID:</span> {trainee.uniqueId}</p>
                <p><span className="font-medium">Phone:</span> {trainee.phoneNumber}</p>
                <p><span className="font-medium">Amount:</span> ₹{trainee.admissionFee}</p>
              </div>
            </div>

            {/* Invoice Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Invoice Date</span>
                </div>
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                This date will appear on the invoice
              </p>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Invoice Preview</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>Invoice No: INV-{trainee.uniqueId}-XXXXXX</p>
                <p>Date: {new Date(invoiceDate).toLocaleDateString()}</p>
                <p>Amount: ₹{trainee.admissionFee}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateInvoice}
              disabled={loading || !invoiceDate}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Generating...' : 'Generate & Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};