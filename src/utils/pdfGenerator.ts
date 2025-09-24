import jsPDF from 'jspdf';
import { WorkoutPlan, DietPlan } from '../types';

export const generateWorkoutPDF = async (plan: WorkoutPlan) => {
  const pdf = new jsPDF();
  
  // Title
  pdf.setFontSize(20);
  pdf.text(`Workout Plan - ${plan.traineeName}`, 20, 30);
  
  // Subtitle
  pdf.setFontSize(12);
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 45);
  
  let y = 65;
  
  plan.days.forEach((day, dayIndex) => {
    // Check if we need a new page
    if (y > 250) {
      pdf.addPage();
      y = 30;
    }
    
    // Day header
    pdf.setFontSize(16);
    pdf.text(`Day ${dayIndex + 1}: ${day.name}`, 20, y);
    y += 15;
    
    // Exercises
    pdf.setFontSize(10);
    day.exercises.forEach((exercise, exerciseIndex) => {
      if (y > 270) {
        pdf.addPage();
        y = 30;
      }
      
      pdf.text(`${exerciseIndex + 1}. ${exercise.name}`, 25, y);
      y += 7;
      pdf.text(`   Sets: ${exercise.sets} | Reps: ${exercise.reps}`, 25, y);
      y += 7;
      
      if (exercise.notes) {
        pdf.text(`   Notes: ${exercise.notes}`, 25, y);
        y += 7;
      }
      
      y += 3;
    });
    
    // Day notes
    if (day.notes) {
      if (y > 270) {
        pdf.addPage();
        y = 30;
      }
      pdf.text(`Day Notes: ${day.notes}`, 25, y);
      y += 10;
    }
    
    y += 10;
  });
  
  // Download the PDF
  pdf.save(`workout-plan-${plan.traineeName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};

export const generateDietPDF = async (plan: DietPlan) => {
  const pdf = new jsPDF();
  
  // Title
  pdf.setFontSize(20);
  pdf.text(`Diet Plan - ${plan.traineeName}`, 20, 30);
  
  // Subtitle
  pdf.setFontSize(12);
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 45);
  
  let y = 65;
  
  plan.days.forEach((day) => {
    // Check if we need a new page
    if (y > 240) {
      pdf.addPage();
      y = 30;
    }
    
    // Day header
    pdf.setFontSize(16);
    pdf.text(`${day.dayName}`, 20, y);
    y += 15;
    
    // Meals
    day.meals.forEach((meal) => {
      if (y > 260) {
        pdf.addPage();
        y = 30;
      }
      
      // Meal header
      pdf.setFontSize(12);
      pdf.text(`${meal.type}: ${meal.name}`, 25, y);
      y += 10;
      
      // Food items
      pdf.setFontSize(10);
      meal.foodItems.forEach((food) => {
        if (y > 280) {
          pdf.addPage();
          y = 30;
        }
        
        const foodText = food.quantity 
          ? `• ${food.name} (${food.quantity})`
          : `• ${food.name}`;
        pdf.text(foodText, 30, y);
        y += 6;
      });
      
      // Meal notes
      if (meal.notes) {
        if (y > 280) {
          pdf.addPage();
          y = 30;
        }
        pdf.text(`Notes: ${meal.notes}`, 30, y);
        y += 8;
      }
      
      y += 5;
    });
    
    y += 10;
  });
  
  // Download the PDF
  pdf.save(`diet-plan-${plan.traineeName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};