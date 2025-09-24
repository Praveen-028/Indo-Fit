import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { useTrainees } from '../hooks/useTrainees';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WorkoutPlan, WorkoutDay, Exercise } from '../types';

interface WorkoutPlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingPlan?: WorkoutPlan | null;
}

export const WorkoutPlanForm: React.FC<WorkoutPlanFormProps> = ({ isOpen, onClose, editingPlan }) => {
  const { trainees } = useTrainees();
  const [step, setStep] = useState(1);
  const [selectedTraineeId, setSelectedTraineeId] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize form data when editing
  useEffect(() => {
    if (editingPlan) {
      setSelectedTraineeId(editingPlan.traineeId);
      setNumberOfDays(editingPlan.days.length);
      setWorkoutDays(editingPlan.days);
      setStep(3); // Go directly to exercise editing
    } else {
      // Reset form
      setSelectedTraineeId('');
      setNumberOfDays(3);
      setWorkoutDays([]);
      setStep(1);
    }
  }, [editingPlan]);

  // Generate workout days when number changes
  const generateWorkoutDays = () => {
    const defaultNames = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Core', 'Full Body'];
    const days: WorkoutDay[] = [];
    
    for (let i = 0; i < numberOfDays; i++) {
      days.push({
        id: `day-${i + 1}`,
        name: defaultNames[i] || `Day ${i + 1}`,
        exercises: [],
        notes: '',
      });
    }
    
    setWorkoutDays(days);
    setStep(3);
  };

  const addExercise = (dayId: string) => {
    setWorkoutDays(prev => prev.map(day => 
      day.id === dayId
        ? {
            ...day,
            exercises: [...day.exercises, {
              id: `exercise-${Date.now()}`,
              name: '',
              sets: 3,
              reps: '10-12',
              notes: '',
            }]
          }
        : day
    ));
  };

  const updateExercise = (dayId: string, exerciseId: string, field: keyof Exercise, value: any) => {
    setWorkoutDays(prev => prev.map(day =>
      day.id === dayId
        ? {
            ...day,
            exercises: day.exercises.map(exercise =>
              exercise.id === exerciseId
                ? { ...exercise, [field]: value }
                : exercise
            )
          }
        : day
    ));
  };

  const removeExercise = (dayId: string, exerciseId: string) => {
    setWorkoutDays(prev => prev.map(day =>
      day.id === dayId
        ? {
            ...day,
            exercises: day.exercises.filter(exercise => exercise.id !== exerciseId)
          }
        : day
    ));
  };

  const updateDayName = (dayId: string, name: string) => {
    setWorkoutDays(prev => prev.map(day =>
      day.id === dayId ? { ...day, name } : day
    ));
  };

  const updateDayNotes = (dayId: string, notes: string) => {
    setWorkoutDays(prev => prev.map(day =>
      day.id === dayId ? { ...day, notes } : day
    ));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const selectedTrainee = trainees.find(t => t.id === selectedTraineeId);
      if (!selectedTrainee) return;

      const planData = {
        traineeId: selectedTraineeId,
        traineeName: selectedTrainee.name,
        days: workoutDays,
        updatedAt: new Date(),
      };

      if (editingPlan) {
        await updateDoc(doc(db, 'workoutPlans', editingPlan.id), planData);
      } else {
        await addDoc(collection(db, 'workoutPlans'), {
          ...planData,
          createdAt: new Date(),
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving workout plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gradient-to-br from-ivory-100 to-ivory-50 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 my-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-purple-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-white">
            {editingPlan ? 'Edit Workout Plan' : 'Create Workout Plan'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Select Trainee</h3>
              <select
                value={selectedTraineeId}
                onChange={(e) => setSelectedTraineeId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-0"
              >
                <option value="">Choose a trainee...</option>
                {trainees.map((trainee) => (
                  <option key={trainee.id} value={trainee.id}>
                    {trainee.name}
                  </option>
                ))}
              </select>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedTraineeId}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Select Number of Workout Days</h3>
              <div className="grid grid-cols-7 gap-3 mb-6">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumberOfDays(num)}
                    className={`aspect-square rounded-lg font-semibold transition-all ${
                      numberOfDays === num
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-purple-600 hover:bg-purple-100 rounded-lg"
                >
                  Back
                </button>
                <button
                  onClick={generateWorkoutDays}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create Days
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-6 space-y-8">
              {workoutDays.map((day, dayIndex) => (
                <div key={day.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <h3 className="text-lg font-semibold">Day {dayIndex + 1}</h3>
                    <input
                      type="text"
                      value={day.name}
                      onChange={(e) => updateDayName(day.id, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Day name (e.g., Push, Pull, Legs)"
                    />
                    <button
                      onClick={() => addExercise(day.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Exercise</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <div key={exercise.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-purple-600">{exerciseIndex + 1}</span>
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={exercise.name}
                              onChange={(e) => updateExercise(day.id, exercise.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Exercise name"
                            />
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sets</label>
                                <input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => updateExercise(day.id, exercise.id, 'sets', Number(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  min="1"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
                                <input
                                  type="text"
                                  value={exercise.reps}
                                  onChange={(e) => updateExercise(day.id, exercise.id, 'reps', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  placeholder="e.g., 10-12, 15, Max"
                                />
                              </div>
                            </div>
                            
                            <textarea
                              value={exercise.notes || ''}
                              onChange={(e) => updateExercise(day.id, exercise.id, 'notes', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Exercise notes (optional)"
                              rows={2}
                            />
                          </div>
                          
                          <button
                            onClick={() => removeExercise(day.id, exercise.id)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-full flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <textarea
                      value={day.notes || ''}
                      onChange={(e) => updateDayNotes(day.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Day notes (optional)"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {step === 3 && (
          <div className="bg-gray-50 px-6 py-4 flex justify-between flex-shrink-0">
            {!editingPlan && (
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 text-purple-600 hover:bg-purple-100 rounded-lg"
              >
                Back
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={loading || workoutDays.some(day => day.exercises.length === 0)}
              className="ml-auto flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Plan'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};