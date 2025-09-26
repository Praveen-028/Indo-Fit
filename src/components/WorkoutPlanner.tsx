import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Plus, 
  Users, 
  CreditCard as Edit, 
  Trash2, 
  Share, 
  FileDown, 
  Search 
} from 'lucide-react';
import { useTrainees } from '../hooks/useTrainees';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WorkoutPlan } from '../types';
import { WorkoutPlanForm } from './WorkoutPlanForm';
import { generateWorkoutPDF } from '../utils/pdfGenerator';

export const WorkoutPlanner: React.FC = () => {
  const { trainees } = useTrainees();
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>(''); // Separate search state

  useEffect(() => {
    const q =
      selectedTraineeId === 'all'
        ? collection(db, 'workoutPlans')
        : query(collection(db, 'workoutPlans'), where('traineeId', '==', selectedTraineeId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plans = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as WorkoutPlan[];

      setWorkoutPlans(
        plans.sort(
          (a, b) => (b.updatedAt?.getTime?.() ?? 0) - (a.updatedAt?.getTime?.() ?? 0)
        )
      );
    });

    return () => unsubscribe();
  }, [selectedTraineeId]);

  const handleEdit = (plan: WorkoutPlan) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleDelete = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this workout plan?')) {
      try {
        await deleteDoc(doc(db, 'workoutPlans', planId));
      } catch (error) {
        console.error('Error deleting workout plan:', error);
      }
    }
  };

  const handleShare = (plan: WorkoutPlan) => {
    const trainee = trainees.find((t) => t.id === plan.traineeId);
    if (!trainee) {
      alert('Trainee not found for this plan');
      return;
    }

    let message = `🏋️ *Workout Plan for ${plan.traineeName}*\n\n`;

    plan.days.forEach((day, dayIndex) => {
      message += `*Day ${dayIndex + 1}: ${day.name}*\n`;

      day.exercises.forEach((exercise, exerciseIndex) => {
        message += `${exerciseIndex + 1}. ${exercise.name}\n`;
        message += `   Sets: ${exercise.sets} | Reps: ${exercise.reps}\n`;
        if (exercise.notes) {
          message += `   Notes: ${exercise.notes}\n`;
        }
        message += '\n';
      });

      if (day.notes) {
        message += `Day Notes: ${day.notes}\n`;
      }

      message += '\n---\n\n';
    });

    message += 'Stay consistent and achieve your goals! 💪';

    const url = `https://wa.me/${trainee.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleDownloadPDF = async (plan: WorkoutPlan) => {
    try {
      await generateWorkoutPDF(plan);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Updated filtering logic
  const filteredPlans = workoutPlans.filter((plan) => {
    // First apply trainee selection filter
    if (selectedTraineeId !== 'all' && plan.traineeId !== selectedTraineeId) {
      return false;
    }
    
    // Then apply search term filter
    if (searchTerm.trim() === '') {
      return true;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return (
      plan.traineeName.toLowerCase().includes(searchLower) ||
      plan.days.some(day => 
        day.name.toLowerCase().includes(searchLower) ||
        day.exercises.some(exercise => 
          exercise.name.toLowerCase().includes(searchLower)
        )
      )
    );
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // If search is cleared, reset to show all
    if (value.trim() === '') {
      setSelectedTraineeId('all');
      return;
    }
    
    // Try to find matching trainee and auto-select
    const searchLower = value.toLowerCase();
    const foundTrainee = trainees.find(
      (t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.phoneNumber.includes(value) ||
        (t.uniqueId && t.uniqueId.toLowerCase().includes(searchLower))
    );
    
    if (foundTrainee) {
      setSelectedTraineeId(foundTrainee.id);
    } else {
      setSelectedTraineeId('all');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ivory-100">Workout Plans</h1>
            <p className="text-green-200 mt-1">Design and manage workout routines</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingPlan(null);
            setShowForm(true);
          }}
          className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg text-sm sm:text-base"
        >
          <Plus className="w-5 h-5" />
          <span>Create Plan</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by trainee name, exercise, or day..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-ivory-100 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-sm sm:text-base"
        />
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-ivory-100 mb-2">
            {searchTerm ? 'No matching workout plans found' : 'No workout plans found'}
          </h3>
          <p className="text-green-200 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms or create a new plan.' 
              : 'Create your first workout plan to get started.'
            }
          </p>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTraineeId('all');
              }}
              className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-6 hover:bg-white/15 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-ivory-100">
                    {plan.traineeName}
                  </h3>
                  <p className="text-green-200 text-sm mt-1">
                    {plan.days.length} day{plan.days.length !== 1 ? 's' : ''} • Updated{' '}
                    {plan.updatedAt ? plan.updatedAt.toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-ivory-200" />
                  </button>
                  <button
                    onClick={() => handleShare(plan)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Share via WhatsApp"
                  >
                    <Share className="w-4 h-4 text-green-400" />
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(plan)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Download PDF"
                  >
                    <FileDown className="w-4 h-4 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Days Preview */}
              <div className="space-y-3">
                {plan.days.slice(0, 3).map((day) => (
                  <div key={day.id} className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-ivory-100 text-sm sm:text-base">{day.name}</h4>
                      <span className="text-xs text-green-300">
                        {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {day.exercises.slice(0, 2).map((exercise) => (
                      <div
                        key={exercise.id}
                        className="text-xs sm:text-sm text-green-200 ml-2"
                      >
                        • {exercise.name} - {exercise.sets} sets × {exercise.reps} reps
                      </div>
                    ))}

                    {day.exercises.length > 2 && (
                      <div className="text-xs text-yellow-400 ml-2 mt-1">
                        +{day.exercises.length - 2} more exercises
                      </div>
                    )}
                  </div>
                ))}

                {plan.days.length > 3 && (
                  <div className="text-center py-2">
                    <span className="text-xs sm:text-sm text-yellow-400">
                      +{plan.days.length - 3} more days
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <WorkoutPlanForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingPlan(null);
        }}
        editingPlan={editingPlan}
      />
    </div>
  );
};