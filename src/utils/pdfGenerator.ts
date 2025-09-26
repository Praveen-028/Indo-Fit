import jsPDF from 'jspdf';
import { WorkoutPlan, DietPlan, Trainee } from '../types';

// Add INDOFIT GYM branding to PDF
const addBranding = (pdf: jsPDF) => {
  // Header background
  pdf.setFillColor(6, 78, 59); // Green color
  pdf.rect(0, 0, 210, 40, 'F');
  
  // Logo area
  pdf.setFillColor(251, 191, 36); // Yellow color
  pdf.rect(15, 10, 20, 20, 'F');
  
  // Logo text
  pdf.setTextColor(6, 78, 59);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('IF', 25, 23);
  
  // Gym name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INDOFIT GYM', 45, 25);
  
  // Subtitle
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Physique LAB7.0', 45, 32);
  
  // Reset colors
  pdf.setTextColor(0, 0, 0);
};

export const generateWorkoutPDF = async (plan: WorkoutPlan) => {
  const pdf = new jsPDF();
  
  // Add branding
  addBranding(pdf);
  
  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Workout Plan - ${plan.traineeName}`, 20, 60);
  
  // Subtitle
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 75);
  
  let y = 95;
  
  plan.days.forEach((day, dayIndex) => {
    // Check if we need a new page
    if (y > 250) {
      pdf.addPage();
      addBranding(pdf);
      y = 60;
    }
    
    // Day header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Day ${dayIndex + 1}: ${day.name}`, 20, y);
    y += 15;
    
    // Exercises
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    day.exercises.forEach((exercise, exerciseIndex) => {
      if (y > 270) {
        pdf.addPage();
        addBranding(pdf);
        y = 60;
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
        addBranding(pdf);
        y = 60;
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
  
  // Add branding
  addBranding(pdf);
  
  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Diet Plan - ${plan.traineeName}`, 20, 60);
  
  // Subtitle
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 75);
  
  let y = 95;
  
  plan.days.forEach((day) => {
    // Check if we need a new page
    if (y > 240) {
      pdf.addPage();
      addBranding(pdf);
      y = 60;
    }
    
    // Day header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${day.dayName}`, 20, y);
    y += 15;
    
    // Meals
    day.meals.forEach((meal) => {
      if (y > 260) {
        pdf.addPage();
        addBranding(pdf);
        y = 60;
      }
      
      // Meal header
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${meal.type}: ${meal.name}`, 25, y);
      y += 10;
      
      // Food items
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      meal.foodItems.forEach((food) => {
        if (y > 280) {
          pdf.addPage();
          addBranding(pdf);
          y = 60;
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
          addBranding(pdf);
          y = 60;
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

export const generateInvoicePDF = async (trainee: Trainee) => {
  const pdf = new jsPDF();
  
  // Add branding
  addBranding(pdf);
  
  // Invoice title
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', 20, 60);
  
  // Invoice details
  const invoiceNo = `INV-${trainee.uniqueId}-${Date.now().toString().slice(-6)}`;
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Invoice No: ${invoiceNo}`, 20, 80);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 90);
  
  // Bill To section
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bill To:', 20, 110);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trainee.name, 20, 125);
  pdf.text(`Phone: ${trainee.phoneNumber}`, 20, 135);
  pdf.text(`Member ID: ${trainee.uniqueId}`, 20, 145);
  
  // Membership details
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Membership Details:', 20, 165);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Admission Date: ${trainee.membershipStartDate.toLocaleDateString()}`, 20, 180);
  pdf.text(`Duration: ${trainee.membershipDuration} month(s)`, 20, 190);
  pdf.text(`Goal: ${trainee.goalCategory}`, 20, 200);
  pdf.text(`Special Training: ${trainee.specialTraining ? 'Yes' : 'No'}`, 20, 210);
  pdf.text(`Payment Type: ${trainee.paymentType}`, 20, 220);
  
  // Amount section
  pdf.setFillColor(240, 240, 240);
  pdf.rect(20, 235, 170, 30, 'F');
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Amount:', 25, 250);
  pdf.text(`₹${trainee.admissionFee}`, 140, 250);
  
  // Footer
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Thank you for choosing INDOFIT GYM!', 20, 280);
  
  // Download the PDF
  pdf.save(`invoice-${trainee.name.replace(/\s+/g, '-').toLowerCase()}-${invoiceNo}.pdf`);
  
  return invoiceNo;
};