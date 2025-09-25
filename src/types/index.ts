export interface Trainee {
  id: string;
  name: string;
  phoneNumber: string;
  membershipDuration: number;
  membershipStartDate: Date;
  membershipEndDate: Date;
  specialTraining: boolean;
  goalCategory: 'Weight Loss' | 'Weight Gain' | 'Strength' | 'Conditioning';
  paymentType: 'Online' | 'Cash';
  isActive: boolean;
  createdAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number | string; // Can be "8-12" or specific number
  notes?: string;
}

export interface WorkoutDay {
  id: string;
  name: string;
  exercises: Exercise[];
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  traineeId: string;
  traineeName: string;
  days: WorkoutDay[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodItem {
  id: string;
  name: string;
  quantity?: string;
}

export interface Meal {
  id: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  name: string;
  foodItems: FoodItem[];
  notes?: string;
}

export interface DietDay {
  id: string;
  dayNumber: number;
  dayName: string;
  meals: Meal[];
}

export interface DietPlan {
  id: string;
  traineeId: string;
  traineeName: string;
  days: DietDay[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AttendanceRecord {
  id: string;
  traineeId: string;
  traineeName: string;
  date: Date;
  present: boolean;
  notes?: string;
}

export interface ExpiringMembership {
  traineeId: string;
  traineeName: string;
  phoneNumber: string;
  expiryDate: Date;
  daysUntilExpiry: number;
}