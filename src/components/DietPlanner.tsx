import React, { useState, useEffect } from 'react';
import { ChefHat, Plus, Edit, Trash2, Share, FileDown } from 'lucide-react';
import { useTrainees } from '../hooks/useTrainees';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DietPlan } from '../types';
import { DietPlanForm } from './DietPlanForm';
import { generateDietPDF } from '../utils/pdfGenerator';

export const DietPlanner: React.FC = () => {
  const { trainees } = useTrainees();
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DietPlan | null>(null);
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('all');

  useEffect(() => {
    const q = selectedTraineeId === 'all' 
      ? collection(db, 'dietPlans')
      : query(collection(db, 'dietPlans'), where('traineeId', '==', selectedTraineeId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as DietPlan[];
      
      setDietPlans(plans.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    });

    return () => unsubscribe();
  }, [selectedTraineeId]);

  const handleEdit = (plan: DietPlan) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleDelete = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this diet plan?')) {
      try {
        await deleteDoc(doc(db, 'dietPlans', planId));
      } catch (error) {
        console.error('Error deleting diet plan:', error);
      }
    }
  };

  const handleShare = (plan: DietPlan) => {
    const trainee = trainees.find(t => t.id === plan.traineeId);
    if (!trainee) return;

    let message = `🥗 *Diet Plan for ${plan.traineeName}*\n\n`;
    
    plan.days.forEach((day) => {
      message += `*${day.dayName}*\n`;
      
      day.meals.forEach((meal) => {
        message += `\n🍽️ *${meal.type}*: ${meal.name}\n`;
        
        meal.foodItems.forEach((item) => {
          message += `• ${item.name}`;
          if (item.quantity) message += ` (${item.quantity})`;
          message += '\n';
        });
        
        if (meal.notes) {
          message += `Notes: ${meal.notes}\n`;
        }
      });
      
      message += '\n---\n\n';
    });
    
    message += 'Follow your diet plan consistently for best results! 🌟';
    
    const url = `https://wa.me/${trainee.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleDownloadPDF = async (plan: DietPlan) => {
    try {
      await generateDietPDF(plan);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const filteredPlans = selectedTraineeId === 'all' 
    ? dietPlans 
    : dietPlans.filter(plan => plan.traineeId === selectedTraineeId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-ivory-100">Diet Plans</h1>
            <p className="text-green-200 mt-1">Create and manage nutrition plans</p>
          </div>
        </div>
        
        <button
          onClick={() => {
            setEditingPlan(null);
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Create Diet Plan</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-ivory-200">Filter by trainee:</label>
        <select
          value={selectedTraineeId}
          onChange={(e) => setSelectedTraineeId(e.target.value)}
          className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-ivory-100 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
        >
          <option value="all">All Trainees</option>
          {trainees.map((trainee) => (
            <option key={trainee.id} value={trainee.id} className="bg-gray-800">
              {trainee.name}
            </option>
          ))}
        </select>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold text-ivory-100 mb-2">No diet plans found</h3>
          <p className="text-green-200 mb-6">Create your first diet plan to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-ivory-100">{plan.traineeName}</h3>
                  <p className="text-green-200 text-sm mt-1">
                    {plan.days.length} day{plan.days.length !== 1 ? 's' : ''} • 
                    Updated {plan.updatedAt.toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
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
                      <h4 className="font-medium text-ivory-100">{day.dayName}</h4>
                      <span className="text-xs text-green-300">
                        {day.meals.length} meal{day.meals.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      {day.meals.map((meal) => (
                        <div key={meal.id} className="text-xs bg-green-800/30 text-green-200 px-2 py-1 rounded">
                          {meal.type}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {plan.days.length > 3 && (
                  <div className="text-center py-2">
                    <span className="text-sm text-yellow-400">+{plan.days.length - 3} more days</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DietPlanForm
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