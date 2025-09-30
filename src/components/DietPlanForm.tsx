import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Plus, Trash2, Save, Search, ChevronDown, ChevronLeft } from 'lucide-react';
import { useTrainees } from '../hooks/useTrainees';
import { collection, addDoc, updateDoc, doc, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DietPlan, DietDay, Meal, FoodItem } from '../types';

// Define types for clarity, though they are imported
// interface Trainee { id: string; name: string; phoneNumber: string; uniqueId?: string; }
// type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const;

interface DietPlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingPlan?: DietPlan | null;
}

// --- Helper Components for Step 3 (for better readability and potential memoization) ---

interface FoodItemRowProps {
  dayId: string;
  mealId: string;
  food: FoodItem;
  updateFoodItem: (dayId: string, mealId: string, foodId: string, field: keyof FoodItem, value: any) => void;
  removeFoodItem: (dayId: string, mealId: string, foodId: string) => void;
}

const FoodItemRow: React.FC<FoodItemRowProps> = React.memo(({ dayId, mealId, food, updateFoodItem, removeFoodItem }) => (
  <div key={food.id} className="flex items-center space-x-2">
    {/* Food Name Input - Full width on mobile, better for tapping */}
    <input
      type="text"
      value={food.name}
      onChange={(e) => updateFoodItem(dayId, mealId, food.id, 'name', e.target.value)}
      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500"
      placeholder="Food item (e.g., 2 Eggs)"
      aria-label={`Food item name for ${mealId}`}
    />
    {/* Quantity Input - Fixed small width */}
    <input
      type="text"
      value={food.quantity || ''}
      onChange={(e) => updateFoodItem(dayId, mealId, food.id, 'quantity', e.target.value)}
      className="w-20 sm:w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500"
      placeholder="Qty/Unit"
      aria-label={`Food item quantity for ${mealId}`}
    />
    {/* Remove Button - High contrast for action */}
    <button
      onClick={() => removeFoodItem(dayId, mealId, food.id)}
      className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
      aria-label="Remove food item"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
));

interface MealEditorProps {
  day: DietDay;
  meal: Meal;
  mealTypes: readonly string[];
  updateMeal: (dayId: string, mealId: string, field: keyof Meal, value: any) => void;
  removeMeal: (dayId: string, mealId: string) => void;
  addFoodItem: (dayId: string, mealId: string) => void;
  updateFoodItem: (dayId: string, mealId: string, foodId: string, field: keyof FoodItem, value: any) => void;
  removeFoodItem: (dayId: string, mealId: string, foodId: string) => void;
}

const MealEditor: React.FC<MealEditorProps> = React.memo(({ day, meal, mealTypes, updateMeal, removeMeal, addFoodItem, updateFoodItem, removeFoodItem }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Control visibility of food items/notes

  return (
    <div key={meal.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex items-start justify-between space-x-3">
        {/* Meal Type & Name - Use grid for better alignment, especially on PC */}
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Meal Type Select */}
            <select
              value={meal.type}
              onChange={(e) => updateMeal(day.id, meal.id, 'type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              aria-label="Meal type"
            >
              {mealTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Meal Name Input */}
            <input
              type="text"
              value={meal.name}
              onChange={(e) => updateMeal(day.id, meal.id, 'name', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              placeholder="Custom meal name (e.g., Post-Workout Shake)"
              aria-label="Meal custom name"
            />
          </div>

          {/* Toggle Button for Details on Mobile */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-orange-600 sm:hidden"
            aria-expanded={isExpanded}
            aria-controls={`meal-details-${meal.id}`}
          >
            <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Remove Meal Button */}
        <button
          onClick={() => removeMeal(day.id, meal.id)}
          className="p-2 mt-1 text-red-600 hover:bg-red-100 rounded-full flex-shrink-0 transition-colors"
          aria-label="Remove meal"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Collapsible Content: Food Items & Notes */}
      <div id={`meal-details-${meal.id}`} className={`space-y-3 mt-4 ${isExpanded ? 'block' : 'hidden sm:block'}`}>
        <hr className="border-gray-100" />
        
        {/* Food Items Header and Add Button */}
        <div className="flex items-center justify-between pt-2">
          <label className="text-sm font-medium text-gray-700">Food Items</label>
          <button
            onClick={() => addFoodItem(day.id, meal.id)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition-colors"
            type="button"
            aria-label="Add new food item"
          >
            <Plus className="w-3 h-3" />
            <span>Add Food</span>
          </button>
        </div>

        {/* Food Item Rows */}
        <div className="space-y-2">
          {meal.foodItems.map((food) => (
            <FoodItemRow
              key={food.id}
              dayId={day.id}
              mealId={meal.id}
              food={food}
              updateFoodItem={updateFoodItem}
              removeFoodItem={removeFoodItem}
            />
          ))}
        </div>
        
        {/* Meal Notes Textarea */}
        <textarea
          value={meal.notes || ''}
          onChange={(e) => updateMeal(day.id, meal.id, 'notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Meal notes (e.g., Cook with minimal oil, take BCAA with this)"
          rows={2}
          aria-label="Meal notes"
        />
      </div>
    </div>
  );
});

// --- Main Component ---

export const DietPlanForm: React.FC<DietPlanFormProps> = ({ isOpen, onClose, editingPlan }) => {
  // ... (All existing state and useEffect hooks remain the same) ...

  const { trainees } = useTrainees();
  const [step, setStep] = useState(1);
  const [selectedTraineeId, setSelectedTraineeId] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [dietDays, setDietDays] = useState<DietDay[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search and filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [existingDietPlanTraineeIds, setExistingDietPlanTraineeIds] = useState<string[]>([]);
  const [loadingTrainees, setLoadingTrainees] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedTraineeId('');
      setNumberOfDays(3);
      setDietDays([]);
      setSearchTerm('');
      setShowDropdown(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Fetch existing diet plan trainee IDs
  useEffect(() => {
    const fetchExistingDietPlans = async () => {
      if (!isOpen) return;
      
      setLoadingTrainees(true);
      try {
        const dietPlansQuery = query(collection(db, 'dietPlans'));
        const snapshot = await getDocs(dietPlansQuery);
        const traineeIds = snapshot.docs.map(doc => doc.data().traineeId);
        
        const filteredIds = editingPlan 
          ? traineeIds.filter(id => id !== editingPlan.traineeId)
          : traineeIds;
          
        setExistingDietPlanTraineeIds(filteredIds);
      } catch (error) {
        console.error('Error fetching existing diet plans:', error);
      } finally {
        setLoadingTrainees(false);
      }
    };

    fetchExistingDietPlans();
  }, [isOpen, editingPlan]);

  // Initialize form data when editing
  useEffect(() => {
    if (isOpen && editingPlan && !loadingTrainees) {
      setSelectedTraineeId(editingPlan.traineeId);
      setNumberOfDays(editingPlan.days.length);
      // Deep clone the days to avoid reference issues
      setDietDays(JSON.parse(JSON.stringify(editingPlan.days)));
      setStep(3); // Go directly to meal editing
      
      const trainee = trainees.find(t => t.id === editingPlan.traineeId);
      if (trainee) {
        setSearchTerm(trainee.name);
      }
    }
  }, [isOpen, editingPlan, trainees, loadingTrainees]);

  // Use useMemo for filtering to prevent unnecessary recalculations
  const availableTrainees = useMemo(() => trainees.filter(trainee => {
    const hasExistingPlan = existingDietPlanTraineeIds.includes(trainee.id);
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
  }), [trainees, existingDietPlanTraineeIds, editingPlan, searchTerm]);

  // Memoize handler functions for performance/stability in child components
  const handleTraineeSelect = useCallback((trainee: any) => {
    setSelectedTraineeId(trainee.id);
    setSearchTerm(trainee.name);
    setShowDropdown(false);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    
    if (selectedTraineeId) {
      const selectedTrainee = trainees.find(t => t.id === selectedTraineeId);
      if (selectedTrainee && !selectedTrainee.name.toLowerCase().includes(value.toLowerCase())) {
        setSelectedTraineeId('');
      }
    }
  }, [selectedTraineeId, trainees]);

  const generateDietDays = useCallback(() => {
    const days: DietDay[] = [];
    
    for (let i = 0; i < numberOfDays; i++) {
      days.push({
        id: `day-${i + 1}-${Date.now()}`, // Ensure unique ID even if days are regenerated
        dayNumber: i + 1,
        dayName: `Day ${i + 1}`,
        meals: [],
      });
    }
    
    setDietDays(days);
    setStep(3);
  }, [numberOfDays]);

  // Use useCallback for all state setters that are passed to children
  const addMeal = useCallback((dayId: string) => {
    setDietDays(prev => prev.map(day => 
      day.id === dayId
        ? {
            ...day,
            meals: [...day.meals, {
              id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More robust ID
              type: 'Breakfast',
              name: '',
              foodItems: [],
              notes: '',
            }]
          }
        : day
    ));
  }, []);

  const updateMeal = useCallback((dayId: string, mealId: string, field: keyof Meal, value: any) => {
    setDietDays(prev => prev.map(day =>
      day.id === dayId
        ? {
            ...day,
            meals: day.meals.map(meal =>
              meal.id === mealId
                ? { ...meal, [field]: value }
                : meal
            )
          }
        : day
    ));
  }, []);

  const removeMeal = useCallback((dayId: string, mealId: string) => {
    setDietDays(prev => prev.map(day =>
      day.id === dayId
        ? {
            ...day,
            meals: day.meals.filter(meal => meal.id !== mealId)
          }
        : day
    ));
  }, []);

  const addFoodItem = useCallback((dayId: string, mealId: string) => {
    setDietDays(prev => prev.map(day =>
      day.id === dayId
        ? {
            ...day,
            meals: day.meals.map(meal =>
              meal.id === mealId
                ? {
                    ...meal,
                    foodItems: [...meal.foodItems, {
                      id: `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More robust ID
                      name: '',
                      quantity: '',
                    }]
                  }
                : meal
            )
          }
        : day
    ));
  }, []);

  const updateFoodItem = useCallback((dayId: string, mealId: string, foodId: string, field: keyof FoodItem, value: any) => {
    setDietDays(prev => prev.map(day =>
      day.id === dayId
        ? {
            ...day,
            meals: day.meals.map(meal =>
              meal.id === mealId
                ? {
                    ...meal,
                    foodItems: meal.foodItems.map(food =>
                      food.id === foodId
                        ? { ...food, [field]: value }
                        : food
                    )
                  }
                : meal
            )
          }
        : day
    ));
  }, []);

  const removeFoodItem = useCallback((dayId: string, mealId: string, foodId: string) => {
    setDietDays(prev => prev.map(day =>
      day.id === dayId
        ? {
            ...day,
            meals: day.meals.map(meal =>
              meal.id === mealId
                ? {
                    ...meal,
                    foodItems: meal.foodItems.filter(food => food.id !== foodId)
                  }
                : meal
            )
          }
        : day
    ));
  }, []);

  const updateDayName = useCallback((dayId: string, name: string) => {
    setDietDays(prev => prev.map(day =>
      day.id === dayId ? { ...day, dayName: name } : day
    ));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const selectedTrainee = trainees.find(t => t.id === selectedTraineeId);
      if (!selectedTrainee) return;

      const planData = {
        traineeId: selectedTraineeId,
        traineeName: selectedTrainee.name,
        days: dietDays,
        updatedAt: new Date(),
      };

      if (editingPlan) {
        await updateDoc(doc(db, 'dietPlans', editingPlan.id), planData);
      } else {
        await addDoc(collection(db, 'dietPlans'), {
          ...planData,
          createdAt: new Date(),
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving diet plan:', error);
      // Optional: Show error toast/message to user
    } finally {
      setLoading(false);
    }
  };
  
  // Determine if the 'Save' button should be disabled
  const isSaveDisabled = loading || dietDays.some(day => day.meals.length === 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto">
      <div className="bg-gradient-to-br from-ivory-100 to-ivory-50 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 my-8 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-800 to-orange-700 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-white truncate">
            {editingPlan ? 'Edit Diet Plan' : 'Create Diet Plan'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close form"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          
          {/* STEP 1: Select Trainee */}
          {step === 1 && (
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4 text-orange-800">Step 1: Select Trainee</h3>
              
              {loadingTrainees ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading trainees...</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay to allow click
                      className="w-full pl-10 pr-10 py-3 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:ring-orange-500"
                      placeholder="Search for a trainee..."
                      aria-label="Search for trainee"
                    />
                    <ChevronDown 
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-transform pointer-events-none ${showDropdown ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {/* Dropdown - Fixed positioning for better mobile scrolling (though inside a scrolling container, so just large shadow) */}
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-10 mt-1">
                      {availableTrainees.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          {searchTerm 
                            ? `No trainees found matching "${searchTerm}"`
                            : 'All trainees already have diet plans'
                          }
                        </div>
                      ) : (
                        availableTrainees.map((trainee) => (
                          <button
                            key={trainee.id}
                            onClick={() => handleTraineeSelect(trainee)}
                            className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-gray-900">{trainee.name}</div>
                            <div className="text-sm text-gray-500">
                              {trainee.phoneNumber} {trainee.uniqueId && `• ID: ${trainee.uniqueId}`}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Selected trainee info */}
                  {selectedTraineeId && (
                    <div className="mt-4 p-4 bg-orange-100 rounded-lg border border-orange-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-orange-900">Selected:</h4>
                          <p className="text-orange-700 font-semibold">
                            {trainees.find(t => t.id === selectedTraineeId)?.name}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTraineeId('');
                            setSearchTerm('');
                          }}
                          className="text-orange-600 hover:text-orange-800 font-medium transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedTraineeId || loadingTrainees}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Number of Days */}
          {step === 2 && (
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-6 text-orange-800">Step 2: Select Plan Duration</h3>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-6">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumberOfDays(num)}
                    className={`aspect-square rounded-xl font-bold text-lg transition-all border-2 ${
                      numberOfDays === num
                        ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                        : 'bg-white text-gray-800 border-gray-200 hover:bg-orange-50'
                    }`}
                    aria-label={`Select ${num} days`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center space-x-1 px-4 sm:px-6 py-3 text-orange-600 hover:bg-orange-100 rounded-lg font-medium transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={generateDietDays}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
                >
                  {editingPlan ? 'Adjust Days' : 'Create Days'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Define Meals */}
          {step === 3 && (
            <div className="p-4 sm:p-6 space-y-8">
              <h3 className="text-lg font-semibold text-orange-800">Step 3: Define Meals</h3>
              <p className='text-sm text-gray-600'>Editing plan for: <span className='font-medium text-orange-700'>{trainees.find(t => t.id === selectedTraineeId)?.name}</span></p>

              {dietDays.map((day) => (
                <div key={day.id} className="border border-orange-300 bg-white rounded-xl shadow-lg p-4 sm:p-6">
                  {/* Day Header/Name */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-6 pb-2 border-b border-orange-100">
                    <h4 className="text-xl font-bold text-orange-800 flex-shrink-0">Day {day.dayNumber}</h4>
                    <input
                      type="text"
                      value={day.dayName}
                      onChange={(e) => updateDayName(day.id, e.target.value)}
                      className="flex-1 w-full sm:w-auto px-4 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring-orange-500 font-medium"
                      placeholder={`Custom name for Day ${day.dayNumber}`}
                      aria-label="Day name"
                    />
                    <button
                      onClick={() => addMeal(day.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex-shrink-0 w-full sm:w-auto justify-center sm:justify-start"
                      type="button"
                      aria-label={`Add meal to Day ${day.dayNumber}`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Meal</span>
                    </button>
                  </div>

                  {/* Meals List */}
                  <div className="space-y-4">
                    {day.meals.length === 0 && (
                      <p className="text-gray-500 text-center py-4 italic">No meals added for this day.</p>
                    )}
                    {day.meals.map((meal) => (
                      <MealEditor 
                        key={meal.id}
                        day={day}
                        meal={meal}
                        mealTypes={mealTypes}
                        updateMeal={updateMeal}
                        removeMeal={removeMeal}
                        addFoodItem={addFoodItem}
                        updateFoodItem={updateFoodItem}
                        removeFoodItem={removeFoodItem}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer for Step 3 (Save Button) */}
        {step === 3 && (
          <div className="bg-gray-100 px-4 sm:px-6 py-4 flex justify-between items-center border-t border-gray-200 flex-shrink-0">
            {!editingPlan && (
              <button
                onClick={() => setStep(2)}
                className="flex items-center space-x-1 px-4 sm:px-6 py-3 text-orange-600 hover:bg-orange-200 rounded-lg font-medium transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className='hidden sm:inline'>Back to Duration</span>
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={isSaveDisabled}
              className={`ml-auto flex items-center space-x-2 px-6 py-3 text-white rounded-lg font-bold transition-colors shadow-md ${
                isSaveDisabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
              aria-label={editingPlan ? 'Save changes to diet plan' : 'Create new diet plan'}
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Save Plan')}</span>
            </button>
          </div>
        )}

        {/* Click outside to close dropdown (must be outside the modal content) */}
        {/* We keep this outside the main modal div but inside the fixed container */}
        {showDropdown && (
          <div 
            className="fixed inset-0 z-5" 
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    </div>
  );
};