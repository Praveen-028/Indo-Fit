import React, { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
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
        experience: editingTrainer.experience,
        salary: editingTrainer.salary,
      });
    } else if (isOpen && !editingTrainer) {
      setFormData({
        name: '',
        phoneNumber: '',
        email: '',
        experience: 0,
        salary: 0,
      });
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

        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                placeholder="Enter trainer name"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                placeholder="Enter 10-digit phone number"
                disabled={editingTrainer ? true : false}
                required
              />
              {editingTrainer && (
                <p className="text-xs text-gray-500 mt-1">
                  Phone number cannot be changed when editing
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                placeholder="Enter email address"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience (Years) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                placeholder="Years of experience"
                min="0"
                max="50"
                required
              />
            </div>

            {/* Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Salary (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-sm sm:text-base"
                placeholder="Enter monthly salary"
                min="0"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 sm:mt-8">
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name || !formData.phoneNumber || !validatePhoneNumber(formData.phoneNumber) || formData.experience < 0 || formData.salary <= 0}
              className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingTrainer ? 'Updating...' : 'Adding...'}
                </span>
              ) : (
                editingTrainer ? 'Update Trainer' : 'Add Trainer'
              )}
            </button>
          </div>

          {/* Form Info */}
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-700">
              <span className="text-red-500">*</span> Required fields. Trainer ID will be auto-generated based on phone number.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};