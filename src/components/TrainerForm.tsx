import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, UserPlus } from 'lucide-react';
import { useTrainers } from '../hooks/useTrainers';
import { Trainer } from '../types';

interface TrainerFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTrainer?: Trainer | null;
}

export const TrainerForm: React.FC<TrainerFormProps> = ({
  isOpen,
  onClose,
  editingTrainer
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    specialization: 'Personal Training' as const,
    experience: 0,
    salary: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addTrainer, updateTrainer, trainers } = useTrainers();

  useEffect(() => {
    if (isOpen && editingTrainer) {
      setFormData({
        name: editingTrainer.name,
        phoneNumber: editingTrainer.phoneNumber,
        email: editingTrainer.email || '',
        specialization: editingTrainer.specialization,
        experience: editingTrainer.experience,
        salary: editingTrainer.salary,
      });
      setStep(1);
    } else if (isOpen && !editingTrainer) {
      setFormData({
        name: '',
        phoneNumber: '',
        email: '',
        specialization: 'Personal Training',
        experience: 0,
        salary: 0,
      });
      setStep(1);
    }
    setError('');
  }, [editingTrainer, isOpen]);

  const validatePhoneNumber = (phone: string) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone);
  };

  const validateEmail = (email: string) => {
    if (!email) return true; // Email is optional
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const generateUniqueId = (phoneNumber: string): string => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const lastSixDigits = cleanNumber.slice(-6);
    return `TR${lastSixDigits}`;
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Invalid phone number format');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Invalid email format');
      return;
    }

    const exists = trainers.some(t =>
      t.phoneNumber === formData.phoneNumber &&
      t.id !== editingTrainer?.id
    );
    if (exists) {
      setError('Phone number already exists');
      return;
    }

    setLoading(true);
    try {
      if (editingTrainer) {
        const updates: Partial<Trainer> = {
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          specialization: formData.specialization,
          experience: formData.experience,
          salary: formData.salary,
        };

        await updateTrainer(editingTrainer.id, updates);
      } else {
        const joiningDate = new Date();

        const trainer: Omit<Trainer, 'id'> = {
          uniqueId: generateUniqueId(formData.phoneNumber),
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          specialization: formData.specialization,
          experience: formData.experience,
          salary: formData.salary,
          joiningDate,
          isActive: true,
          createdAt: new Date(),
        };

        await addTrainer(trainer);
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError(editingTrainer ? 'Error updating trainer' : 'Error adding trainer');
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
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {editingTrainer ? 'Edit Trainer' : 'Add New Trainer'}
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
            <span className="text-sm text-green-600">{step === 1 ? 'Basic Info' : 'Professional Details'}</span>
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
                  placeholder="Enter trainer name"
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
                  disabled={editingTrainer ? true : false}
                />
                {editingTrainer && (
                  <p className="text-xs text-gray-500 mt-1">
                    Phone number cannot be changed when editing
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                  placeholder="Enter email address"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                <select
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value as any })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                >
                  <option value="Personal Training">Personal Training</option>
                  <option value="Group Classes">Group Classes</option>
                  <option value="Nutrition">Nutrition</option>
                  <option value="Physiotherapy">Physiotherapy</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                <input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                  placeholder="Years of experience"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary (₹)</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                  placeholder="Enter monthly salary"
                  min="0"
                />
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
                {loading ? (editingTrainer ? 'Updating...' : 'Adding...') : (editingTrainer ? 'Update Trainer' : 'Add Trainer')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};