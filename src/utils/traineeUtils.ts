// Generate unique ID from mobile number
export const generateUniqueId = (phoneNumber: string): string => {
  // Remove any non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Take last 6 digits and add prefix
  const lastSixDigits = cleanNumber.slice(-6);
  return `IF${lastSixDigits}`;
};

// Check if date is today
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// Check if date is in the past
export const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

// Check if date is in the future
export const isFutureDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate > today;
};