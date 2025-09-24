import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { useTrainees } from '../hooks/useTrainees';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DietPlan, DietDay, Meal, FoodItem } from '../types';

interface DietPlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingPlan?: DietPlan | null;
}

const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const;

export const DietPlanForm: React.FC<DietPlanFormProps> = ({ isOpen, onClose, editingPlan }) => {
  const { trainees } = useTrainees();
  const [step, setStep] = useState(1);
  const [selectedTraineeId, setSelectedTraineeId] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [dietDays, setDietDays] = useState<DietDay[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize form data when editing
  useEffect(() => {
    if (editingPlan) {
      setSelectedTraineeId(editingPlan.traineeId);
      setNumberOfDays(editingPlan.days.length);
      setDietDays(editingPlan.days);
      setStep(3); // Go directly to meal editing
    } else {
      // Reset form
      setSelectedTraineeId('');
      setNumberOfDays(3);
      setDietDays([]);
      setStep(1);
    }
  }, [editingPlan]);

  const generateDietDays = () => {
    const days: DietDay[] = [];
    
    for (let i = 0; i < numberOfDays; i++) {
      days.push({
        id: `day-${i + 1}`,
        dayNumber: i + 1,
        dayName: `Day ${i + 1}`,
        meals: [],
      });
    }
    
    setDietDays(days);
    setStep(3);
  };

  const addMeal = (dayId: string) => {
    setDietDays(prev => prev.map(day => 
      day.id === dayId
        ? {
            ...day,
            meals: [...day.meals, {
              id: `meal-${Date.now()}`,
              type: 'Breakfast',
              name: '',
              foodItems: [],
              notes: '',
            }]
          }
        : day
    ));
  };

  const updateMeal = (dayId: string, mealId: string, field: keyof Meal, value: any) => {
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
  };

  const removeMeal = (dayId: string, mealId: string) => {
    setDietDays(prev => prev.map(day =>
      day.id === dayId
        ? {
            ...day,
            meals: day.meals.filter(meal => meal.id !== mealId)
          }
        : day
    ));
  };

  const addFoodItem = (dayId: string, mealId: string) => {
    setDietDays(prev => prev.map(day =>
      day.id === dayId
        ? {
            ...day,
            meals: day.meals.map(meal =>
              meal.id === mealId
                ? {
                    ...meal,
                    foodItems: [...meal.foodItems, {
                      id: `food-${Date.now()}`,
                      name: '',
                      quantity: '',
                    }]
                  }
                : meal
            )
          }
        : day
    ));
  };

  const updateFoodItem = (dayId: string, mealId: string, foodId: string, field: keyof FoodItem, value: any) => {
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
  };

  const removeFoodItem = (dayId: string, mealId: string, foodId: string) => {
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
  };

  const updateDayName = (dayId: string, name: string) => {
    setDietDays(prev => prev.map(day =>
      day.id === dayId ? { ...day, dayName: name } : day
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
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gradient-to-br from-ivory-100 to-ivory-50 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 my-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-800 to-orange-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-white">
            {editingPlan ? 'Edit Diet Plan' : 'Create Diet Plan'}
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
                className="w-full px-4 py-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring-0"
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
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Select Number of Days</h3>
              <div className="grid grid-cols-7 gap-3 mb-6">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumberOfDays(num)}
                    className={`aspect-square rounded-lg font-semibold transition-all ${
                      numberOfDays === num
                        ? 'bg-orange-600 text-white'
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
                  className="px-6 py-3 text-orange-600 hover:bg-orange-100 rounded-lg"
                >
                  Back
                </button>
                <button
                  onClick={generateDietDays}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Create Days
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-6 space-y-8">
              {dietDays.map((day) => (
                <div key={day.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <h3 className="text-lg font-semibold">Day {day.dayNumber}</h3>
                    <input
                      type="text"
                      value={day.dayName}
                      onChange={(e) => updateDayName(day.id, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Day name"
                    />
                    <button
                      onClick={() => addMeal(day.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Meal</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {day.meals.map((meal) => (
                      <div key={meal.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <select
                                value={meal.type}
                                onChange={(e) => updateMeal(day.id, meal.id, 'type', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                              >
                                {mealTypes.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                              
                              <input
                                type="text"
                                value={meal.name}
                                onChange={(e) => updateMeal(day.id, meal.id, 'name', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Meal name"
                              />
                            </div>
                            
                            {/* Food Items */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Food Items</label>
                                <button
                                  onClick={() => addFoodItem(day.id, meal.id)}
                                  className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                  + Add Food
                                </button>
                              </div>
                              
                              {meal.foodItems.map((food) => (
                                <div key={food.id} className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={food.name}
                                    onChange={(e) => updateFoodItem(day.id, meal.id, food.id, 'name', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="Food item"
                                  />
                                  <input
                                    type="text"
                                    value={food.quantity || ''}
                                    onChange={(e) => updateFoodItem(day.id, meal.id, food.id, 'quantity', e.target.value)}
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="Qty"
                                  />
                                  <button
                                    onClick={() => removeFoodItem(day.id, meal.id, food.id)}
                                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            
                            <textarea
                              value={meal.notes || ''}
                              onChange={(e) => updateMeal(day.id, meal.id, 'notes', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="Meal notes (optional)"
                              rows={2}
                            />
                          </div>
                          
                          <button
                            onClick={() => removeMeal(day.id, meal.id)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-full flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
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
                className="px-6 py-3 text-orange-600 hover:bg-orange-100 rounded-lg"
              >
                Back
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={loading || dietDays.some(day => day.meals.length === 0)}
              className="ml-auto flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
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