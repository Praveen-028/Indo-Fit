import { useState, useEffect } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { useTrainees } from './useTrainees';
import { ExpiringMembership } from '../types';

export const useNotifications = () => {
  const { trainees } = useTrainees();
  const [expiringMemberships, setExpiringMemberships] = useState<ExpiringMembership[]>([]);
  const [hasNotifications, setHasNotifications] = useState(false);

  useEffect(() => {
    const checkExpiringMemberships = () => {
      const today = new Date();
      const expiring = trainees.filter(trainee => {
        const daysUntilExpiry = differenceInDays(new Date(trainee.membershipEndDate), today);
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 4;
      }).map(trainee => ({
        traineeId: trainee.id,
        traineeName: trainee.name,
        phoneNumber: trainee.phoneNumber,
        expiryDate: new Date(trainee.membershipEndDate),
        daysUntilExpiry: differenceInDays(new Date(trainee.membershipEndDate), today),
      }));

      setExpiringMemberships(expiring);
      setHasNotifications(expiring.length > 0);
    };

    checkExpiringMemberships();
  }, [trainees]);

  const generateWhatsAppMessage = (trainee: ExpiringMembership) => {
    const expiryDateStr = trainee.expiryDate.toLocaleDateString('en-IN');
    return `Hello ${trainee.traineeName}, your membership plan will expire on ${expiryDateStr}. Please renew.`;
  };

  const sendWhatsAppMessage = (trainee: ExpiringMembership) => {
    const message = generateWhatsAppMessage(trainee);
    const url = `https://wa.me/${trainee.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return {
    expiringMemberships,
    hasNotifications,
    sendWhatsAppMessage,
  };
};