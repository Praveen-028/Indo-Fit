import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Plus, Trash2, Save, Search, ChevronDown, ChevronLeft } from 'lucide-react';
import { useTrainees } from '../hooks/useTrainees';
import { collection, addDoc, updateDoc, doc, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FIXED_USER_UID } from '../lib/firebase';
import { WorkoutPlan, WorkoutDay, Exercise } from '../types';

interface WorkoutPlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingPlan?: WorkoutPlan | null;
}

// --- OPTIMIZATION 1: Centralized Default Exercise (Good practice) ---
const DEFAULT_NEW_EXERCISE: Omit<Exercise, 'id'> = {
  name: '',
  sets: 3,
  reps: '10-12',
  notes: '',
};

// --- OPTIMIZATION 2: Extracted Exercise Component for Performance (Memoization) ---
interface ExerciseRowProps {
  dayId: string;
  exercise: Exercise;
  exerciseIndex: number;
  updateExercise: (dayId: string, exerciseId: string, field: keyof Exercise, value: any) => void;
  removeExercise: (dayId: string, exerciseId: string) => void;
}

const WorkoutExerciseRow: React.FC<ExerciseRowProps> = React.memo(({
  dayId,
  exercise,
  exerciseIndex,
  updateExercise,
  removeExercise
}) => (
  <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
    <div className="flex items-start space-x-3">
      {/* Index Circle (Fixed size on all screens) */}
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
        <span className="text-xs sm:text-sm font-semibold text-purple-600">{exerciseIndex + 1}</span>
      </div>
      
      <div className="flex-1 space-y-3">
        {/* Exercise Name Input */}
        <input
          type="text"
          value={exercise.name}
          onChange={(e) => updateExercise(dayId, exercise.id, 'name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-purple-500 focus:border-purple-500"
          placeholder="Exercise name (e.g., Barbell Squat)"
        />
        
        {/* Sets/Reps Inputs (Responsive grid) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sets</label>
            <input
              type="number"
              value={exercise.sets}
              // OPTIMIZATION: Ensure sets is always a number >= 1
              onChange={(e) => updateExercise(dayId, exercise.id, 'sets', Math.max(1, Number(e.target.value) || 1))} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
              min="1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reps/Duration</label>
            <input
              type="text"
              value={exercise.reps}
              onChange={(e) => updateExercise(dayId, exercise.id, 'reps', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., 10-12, 60s, RPE 8"
            />
          </div>
        </div>
        
        {/* Notes Textarea (Better spacing) */}
        <textarea
          value={exercise.notes || ''}
          onChange={(e) => updateExercise(dayId, exercise.id, 'notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
          placeholder="Notes (optional: RPE, super-set details, rest time...)"
          rows={2}
        />
      </div>
      
      {/* Remove Button */}
      <button
        onClick={() => removeExercise(dayId, exercise.id)}
        className="p-1 sm:p-2 text-red-500 hover:bg-red-100 rounded-full flex-shrink-0 transition-colors mt-1"
        aria-label="Remove exercise"
      >
        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  </div>
));

WorkoutExerciseRow.displayName = 'WorkoutExerciseRow'; // Required for React.memo debugging

// --- MAIN COMPONENT ---
export const WorkoutPlanForm: React.FC<WorkoutPlanFormProps> = ({ isOpen, onClose, editingPlan }) => {
  const { trainees } = useTrainees();
  const [step, setStep] = useState(1);
  const [selectedTraineeId, setSelectedTraineeId] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search and filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [existingWorkoutPlanTraineeIds, setExistingWorkoutPlanTraineeIds] = useState<string[]>([]);
  const [loadingTrainees, setLoadingTrainees] = useState(false);

  // === Effect 1: Reset Form (Cleaned dependency array) ===
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedTraineeId('');
      setNumberOfDays(3);
      setWorkoutDays([]);
      setSearchTerm('');
      setShowDropdown(false);
      setLoading(false);
    }
  }, [isOpen]);

  // === Effect 2: Fetch Existing Workout Plan Trainee IDs (Optimized dependency array) ===
  useEffect(() => {
    const fetchExistingWorkoutPlans = async () => {
      if (!isOpen) return;
      
      setLoadingTrainees(true);
      try {
        const workoutPlansQuery = query(collection(db, 'workoutPlans'));
        const snapshot = await getDocs(workoutPlansQuery);
        const traineeIds = snapshot.docs.map(doc => doc.data().traineeId);
        
        // Exclude the current editing plan's trainee from the 'taken' list
        const filteredIds = editingPlan 
          ? traineeIds.filter(id => id !== editingPlan.traineeId)
          : traineeIds;
          
        setExistingWorkoutPlanTraineeIds(filteredIds);
      } catch (error) {
        console.error('Error fetching existing workout plans:', error);
      } finally {
        setLoadingTrainees(false);
      }
    };

    fetchExistingWorkoutPlans();
  }, [isOpen, editingPlan?.traineeId]); // Depend only on editingPlan.traineeId if it exists

  // === Effect 3: Initialize Form for Editing ===
  useEffect(() => {
    if (isOpen && editingPlan && !loadingTrainees) {
      // Ensure the trainee exists in the list before setting state
      const trainee = trainees.find(t => t.id === editingPlan.traineeId);
      if (trainee) {
        setSelectedTraineeId(editingPlan.traineeId);
        setNumberOfDays(editingPlan.days.length);
        // Deep clone the days to avoid reference issues
        setWorkoutDays(JSON.parse(JSON.stringify(editingPlan.days)));
        setSearchTerm(trainee.name);
        setStep(3); // Go directly to exercise editing
      }
    }
  }, [isOpen, editingPlan, trainees, loadingTrainees]);

  // === OPTIMIZATION 3: Memoized availableTrainees calculation ===
  const availableTrainees = useMemo(() => {
    return trainees.filter(trainee => {
      const hasExistingPlan = existingWorkoutPlanTraineeIds.includes(trainee.id);
      const isCurrentlyEditing = editingPlan && trainee.id === editingPlan.traineeId;
      
      if (hasExistingPlan && !isCurrentlyEditing) {
        return false;
      }

      if (searchTerm.trim() === '') {
        return true;
      }

      const searchLower = searchTerm.toLowerCase();
      return (
        trainee.name.toLowerCase().includes(searchLower) ||
        trainee.phoneNumber.includes(searchTerm) ||
        (trainee.uniqueId && trainee.uniqueId.toLowerCase().includes(searchLower))
      );
    });
  }, [trainees, existingWorkoutPlanTraineeIds, editingPlan, searchTerm]);

  // === OPTIMIZATION 4: Memoized Handlers (useCallback) ===
  const handleTraineeSelect = useCallback((trainee: any) => {
    setSelectedTraineeId(trainee.id);
    setSearchTerm(trainee.name);
    setShowDropdown(false);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    
    // Clear selection if the search term changes and no longer matches the selected name
    const selectedTrainee = trainees.find(t => t.id === selectedTraineeId);
    if (selectedTrainee && !selectedTrainee.name.toLowerCase().includes(value.toLowerCase())) {
      setSelectedTraineeId('');
    }
  };

  // --- Day/Exercise CRUD Handlers (useCallback for stability) ---
  
  // OPTIMIZATION: Preserve existing day data when changing number of days
  const generateWorkoutDays = () => {
    const defaultNames = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Core', 'Full Body'];
    const newDays: WorkoutDay[] = [];
    
    for (let i = 0; i < numberOfDays; i++) {
      const existingDay = workoutDays[i];
      if (existingDay) {
        newDays.push(existingDay); // Preserve existing day and its exercises/notes
      } else {
        newDays.push({
          id: `day-${Date.now() + i}`, 
          name: defaultNames[i] || `Day ${i + 1}`,
          exercises: [],
          notes: '',
        });
      }
    }
    
    setWorkoutDays(newDays);
    setStep(3);
  };
  
  const addExercise = useCallback((dayId: string) => {
    setWorkoutDays(prev => prev.map(day => 
      day.id === dayId
        ? {
            ...day,
            exercises: [...day.exercises, {
              id: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              ...DEFAULT_NEW_EXERCISE,
            }]
          }
        : day
    ));
  }, []);

  const updateExercise = useCallback((dayId: string, exerciseId: string, field: keyof Exercise, value: any) => {
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
  }, []);

  const removeExercise = useCallback((dayId: string, exerciseId: string) => {
    setWorkoutDays(prev => prev.map(day =>
      day.id === dayId
        ? {
            ...day,
            exercises: day.exercises.filter(exercise => exercise.id !== exerciseId)
          }
        : day
    ));
  }, []);

  const updateDayName = useCallback((dayId: string, name: string) => {
    setWorkoutDays(prev => prev.map(day =>
      day.id === dayId ? { ...day, name } : day
    ));
  }, []);

  const updateDayNotes = useCallback((dayId: string, notes: string) => {
    setWorkoutDays(prev => prev.map(day =>
      day.id === dayId ? { ...day, notes } : day
    ));
  }, []);

  // === Save Handler with Validation ===
  const handleSave = async () => {
    // Simple validation
    const allDaysValid = workoutDays.every(day => day.exercises.length > 0);
    if (!allDaysValid) {
        alert("Please ensure every workout day has at least one exercise.");
        return;
    }
    
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div 
        className="bg-gradient-to-br from-ivory-100 to-ivory-50 rounded-2xl shadow-2xl w-full max-w-lg sm:max-w-4xl mx-2 my-4 max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300"
        onMouseDown={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-purple-700 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-purple-900">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            {editingPlan ? 'Edit Workout Plan' : 'Create Workout Plan'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close form"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* STEP 1: Select Trainee */}
          {step === 1 && (
            <div>
              <h3 className="text-xl font-semibold mb-6 text-purple-800">Step 1: Select Trainee 🧍</h3>
              
              {loadingTrainees ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 mt-3">Loading available trainees...</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Search Input (Responsive padding and size) */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full pl-10 pr-10 py-3 border-2 border-purple-300 rounded-xl text-base focus:border-purple-600 focus:ring-purple-600 shadow-md transition-shadow"
                      placeholder="Search trainee by name, phone, or ID..."
                      autoComplete="off"
                    />
                    <ChevronDown 
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {/* Dropdown (Max height for mobile) */}
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-20 mt-2">
                      {availableTrainees.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          {searchTerm 
                            ? `No results for "${searchTerm}"`
                            : 'All eligible trainees have a plan.'
                          }
                        </div>
                      ) : (
                        availableTrainees.map((trainee) => (
                          <button
                            key={trainee.id}
                            onClick={() => handleTraineeSelect(trainee)}
                            className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-gray-900">{trainee.name}</div>
                            <div className="text-xs text-gray-500">
                              {trainee.phoneNumber} {trainee.uniqueId && `• ID: ${trainee.uniqueId}`}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Selected trainee info */}
                  {selectedTraineeId && (
                    <div className="mt-5 p-4 bg-purple-100 rounded-xl border border-purple-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-purple-900">Selected Trainee:</h4>
                          <p className="text-lg font-bold text-purple-700">
                            {trainees.find(t => t.id === selectedTraineeId)?.name}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTraineeId('');
                            setSearchTerm('');
                          }}
                          className="text-purple-600 hover:text-purple-800 text-sm p-2 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedTraineeId || loadingTrainees}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  Next: Select Days
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Number of Days */}
          {step === 2 && (
            <div>
              <h3 className="text-xl font-semibold mb-8 text-purple-800">Step 2: How many workout days per week? 🗓️</h3>
              
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-12 max-w-xl mx-auto">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumberOfDays(num)}
                    className={`aspect-square rounded-xl text-lg sm:text-xl font-bold transition-all shadow-md hover:scale-105 ${
                      numberOfDays === num
                        ? 'bg-purple-600 text-white ring-4 ring-purple-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center space-x-1 px-4 py-3 text-purple-600 hover:bg-purple-100 rounded-xl font-medium transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={generateWorkoutDays}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg"
                >
                  Define Exercises
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Define Workout Days and Exercises */}
          {step === 3 && (
            <div className="space-y-8">
              <h3 className="text-xl font-semibold text-purple-800">Step 3: Define Workout Plan 💪</h3>
              
              {workoutDays.map((day, dayIndex) => (
                <div key={day.id} className="bg-ivory-50 border border-purple-200 rounded-xl shadow-lg p-4 sm:p-6">
                  {/* Day Header/Name/Add Exercise (Better alignment) */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 border-b pb-4">
                    <h3 className="text-lg font-bold text-purple-800 flex-shrink-0 w-full sm:w-auto">Day {dayIndex + 1}</h3>
                    <input
                      type="text"
                      value={day.name}
                      onChange={(e) => updateDayName(day.id, e.target.value)}
                      className="flex-1 w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-base focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Day name (e.g., Push, Pull, Legs)"
                    />
                    <button
                      onClick={() => addExercise(day.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex-shrink-0 w-full sm:w-auto justify-center sm:justify-start"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Add Exercise</span>
                    </button>
                  </div>

                  {/* Exercises List */}
                  <div className="space-y-4 pt-2">
                    {day.exercises.length === 0 ? (
                      <p className="text-gray-500 text-center py-6 border-dashed border-2 border-gray-200 rounded-lg">
                        Click "Add Exercise" to start building this workout day.
                      </p>
                    ) : (
                      day.exercises.map((exercise, exerciseIndex) => (
                        <WorkoutExerciseRow
                          key={exercise.id}
                          dayId={day.id}
                          exercise={exercise}
                          exerciseIndex={exerciseIndex}
                          updateExercise={updateExercise}
                          removeExercise={removeExercise}
                        />
                      ))
                    )}
                  </div>

                  {/* Day Notes */}
                  <div className="mt-6 pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Day Notes/Instructions (Optional)</label>
                    <textarea
                      value={day.notes || ''}
                      onChange={(e) => updateDayNotes(day.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:ring-purple-500"
                      placeholder="e.g., Mobility warm-up required, use RIR 2 on all sets."
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              
              {/* Validation Message */}
              {workoutDays.some(day => day.exercises.length === 0) && (
                  <p className="text-red-600 text-sm mt-4 p-3 bg-red-100 border border-red-300 rounded-xl font-medium">
                      ⚠️ **Validation:** All workout days must have at least one exercise before you can save.
                  </p>
              )}
            </div>
          )}
        </div>

        {/* Footer/Save Button */}
        {(step === 2 || step === 3) && (
          <div className="bg-gray-100 px-4 sm:px-6 py-4 flex justify-between items-center flex-shrink-0 border-t border-gray-200">
            {/* Back Button for Step 3 (Only visible if NOT editing) */}
            {step === 3 && !editingPlan && (
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 sm:px-6 sm:py-3 text-purple-600 hover:bg-purple-200 rounded-xl font-medium text-sm sm:text-base"
              >
                Back to Days
              </button>
            )}
            
            {/* Save Button is only active on Step 3 */}
            {step === 3 && (
              <button
                onClick={handleSave}
                disabled={loading || workoutDays.some(day => day.exercises.length === 0)}
                className="ml-auto flex items-center space-x-2 px-6 py-3 sm:px-8 sm:py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-xl"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{loading ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Save New Plan')}</span>
              </button>
            )}

            {/* Placeholder for alignment on Step 2 or when editing */}
            {step === 2 && <div />}
            {step === 3 && editingPlan && <div />}
          </div>
        )}

        {/* Click outside to close dropdown (Placed outside the modal structure for correct layering) */}
        {showDropdown && (
          <div 
            className="fixed inset-0 z-10 cursor-default" 
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    </div>
  );
};