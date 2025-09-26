import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, UserPlus } from 'lucide-react';
import { useTrainees } from '../hooks/useTrainees';
import { Trainee } from '../types';

interface TraineeFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTrainee?: Trainee | null; // NEW: Optional editing trainee prop
}

export const TraineeForm: React.FC<TraineeFormProps> = ({
  isOpen,
  onClose,
  editingTrainee // NEW: Receive editingTrainee prop
}) => {
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
  // Assuming useTrainees now returns updateTrainee
  const { addTrainee, updateTrainee, trainees } = useTrainees();

  // NEW: Effect to populate form when editing and reset when closing/adding
  useEffect(() => {
    if (isOpen && editingTrainee) {
      // Populate form for editing
      setFormData({
        name: editingTrainee.name,
        phoneNumber: editingTrainee.phoneNumber,
        membershipDuration: editingTrainee.membershipDuration,
        admissionFee: editingTrainee.admissionFee,
        specialTraining: editingTrainee.specialTraining,
        goalCategory: editingTrainee.goalCategory,
        paymentType: editingTrainee.paymentType,
      });
      // Always start from step 1 when opening the form
      setStep(1);
    } else if (isOpen && !editingTrainee) {
      // Reset form for a new trainee
      setFormData({
        name: '',
        phoneNumber: '',
        membershipDuration: 1,
        admissionFee: 0,
        specialTraining: false,
        goalCategory: 'Weight Loss',
        paymentType: 'Cash',
      });
      setStep(1);
    }
    setError(''); // Clear any existing errors
  }, [editingTrainee, isOpen]);

  const validatePhoneNumber = (phone: string) => {
    // Indian mobile number validation
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone);
  };

  const handleSubmit = async () => {
    setError('');
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Invalid phone number format');
      return;
    }

    // NEW: When editing, skip phone number duplicate check if it's the same trainee's phone
    const exists = trainees.some(t =>
      t.phoneNumber === formData.phoneNumber &&
      t.id !== editingTrainee?.id // Allow same phone for current trainee
    );
    if (exists) {
      setError('Phone number already exists');
      return;
    }

    setLoading(true);
    try {
      if (editingTrainee) {
        // NEW: Update existing trainee
        const updates: Partial<Trainee> = {
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          membershipDuration: formData.membershipDuration,
          admissionFee: formData.admissionFee,
          specialTraining: formData.specialTraining,
          goalCategory: formData.goalCategory,
          paymentType: formData.paymentType,
          // Do not update uniqueId, createdAt, isActive here unless explicitly needed
        };

        // NEW: Only recalculate membership dates if duration changed
        if (formData.membershipDuration !== editingTrainee.membershipDuration) {
          // Use the original start date to calculate the new end date
          const startDate = editingTrainee.membershipStartDate; 
          const endDate = new Date(startDate);
          // Note: membershipStartDate might be a string if not properly typed as Date, 
          // ensure it's handled correctly by your useTrainees hook/types
          endDate.setMonth(endDate.getMonth() + formData.membershipDuration);
          updates.membershipEndDate = endDate;
        }

        await updateTrainee(editingTrainee.id, updates);
      } else {
        // Original add trainee logic
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + formData.membershipDuration);

        const trainee: Omit<Trainee, 'id'> = {
          uniqueId: formData.phoneNumber,
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
      }

      onClose();
      // Form reset is handled by the useEffect on `editingTrainee` and `isOpen` change
    } catch (err) {
      console.error(err);
      setError(editingTrainee ? 'Error updating trainee' : 'Error adding trainee');
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
            {/* Dynamic header text */}
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {editingTrainee ? 'Edit Trainee' : 'Add New Trainee'}
            </h2>
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
            // --- STEP 1: Basic Info (Name & Phone) ---
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
                  // Disable phone editing for existing trainees to avoid conflicts
                  disabled={editingTrainee ? true : false}
                />
                {/* Show note when editing */}
                {editingTrainee && (
                  <p className="text-xs text-gray-500 mt-1">
                    Phone number cannot be changed when editing
                  </p>
                )}
              </div>
            </div>
          ) : (
            // --- STEP 2: Membership Details ---
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Membership Duration</label>
                <select
                  value={formData.membershipDuration}
                  onChange={(e) => setFormData({ ...formData, membershipDuration: Number(e.target.value) })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
                {/* Show warning when editing membership duration */}
                {editingTrainee && formData.membershipDuration !== editingTrainee.membershipDuration && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Changing duration will recalculate membership end date from original start date
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Category</label>
                <select
                  value={formData.goalCategory}
                  onChange={(e) => setFormData({ ...formData, goalCategory: e.target.value as any })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                >
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Weight Gain">Weight Gain</option>
                  <option value="Strength">Strength</option>
                  <option value="Conditioning">Conditioning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admission Fee (₹)</label>
                <input
                  type="number"
                  value={formData.admissionFee}
                  onChange={(e) => setFormData({ ...formData, admissionFee: Number(e.target.value) })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                  placeholder="Enter admission fee"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                <select
                  value={formData.paymentType}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as any })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Special Training</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, specialTraining: !formData.specialTraining })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.specialTraining ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.specialTraining ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 sm:mt-8">
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
                disabled={!formData.name || !formData.phoneNumber || !validatePhoneNumber(formData.phoneNumber)}
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
                {/* Dynamic Button Text */}
                {loading ? (editingTrainee ? 'Updating...' : 'Adding...') : (editingTrainee ? 'Update Trainee' : 'Add Trainee')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};