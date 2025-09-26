import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, UserPlus } from 'lucide-react';
import { useTrainees } from '../hooks/useTrainees';
import { Trainee } from '../types';

interface TraineeFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TraineeForm: React.FC<TraineeFormProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    membershipDuration: 1,
    admissionFee: 0,
    specialTraining: false,
    goalCategory: 'Weight Loss' as const,
    paymentType: 'Cash' as const,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addTrainee, trainees } = useTrainees(); // Make sure useTrainees returns the list of existing trainees

  const validatePhoneNumber = (phone: string) => {
    // Basic Indian mobile number validation
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone);
  };

  const handleSubmit = async () => {
    setError('');
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Invalid phone number format');
      return;
    }

    // Check if phone number already exists
    const exists = trainees.some(t => t.phoneNumber === formData.phoneNumber);
    if (exists) {
      setError('Phone number already exists');
      return;
    }

    setLoading(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + formData.membershipDuration);

      const trainee: Omit<Trainee, 'id'> = {
        uniqueId: formData.phoneNumber, // Use phone as unique ID
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        membershipDuration: formData.membershipDuration,
        membershipStartDate: startDate,
        membershipEndDate: endDate,
        admissionFee: formData.admissionFee,
        specialTraining: formData.specialTraining,
        goalCategory: formData.goalCategory,
        paymentType: formData.paymentType,
        isActive: true,
        createdAt: new Date(),
      };

      await addTrainee(trainee);
      onClose();
      setStep(1);
      setFormData({
        name: '',
        phoneNumber: '',
        membershipDuration: 1,
        admissionFee: 0,
        specialTraining: false,
        goalCategory: 'Weight Loss',
        paymentType: 'Cash',
      });
    } catch (error) {
      console.error('Error adding trainee:', error);
      setError('Error adding trainee');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gradient-to-br from-ivory-100 to-ivory-50 rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-green-900" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Add New Trainee</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 sm:px-6 py-3 bg-green-50 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Step {step} of 2</span>
            <span className="text-sm text-green-600">{step === 1 ? 'Basic Info' : 'Membership Details'}</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-600 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                  placeholder="Enter trainee name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          ) : (
            // Membership details (unchanged)
            <div className="space-y-4">
              {/* ... same as your existing step 2 content ... */}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 sm:mt-8 px-4 sm:px-6 pb-4 sm:pb-6">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-green-700 hover:bg-green-100 rounded-lg transition-colors text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            
            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.phoneNumber}
                className="ml-auto flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 transition-all text-sm sm:text-base"
              >
                {loading ? 'Adding...' : 'Add Trainee'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
