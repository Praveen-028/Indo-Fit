import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trainee } from '../types';

export const useTrainees = () => {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'trainees'), where('isActive', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const traineesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        membershipStartDate: doc.data().membershipStartDate?.toDate(),
        membershipEndDate: doc.data().membershipEndDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Trainee[];
      
      setTrainees(traineesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addTrainee = async (traineeData: Omit<Trainee, 'id'>) => {
    try {
      await addDoc(collection(db, 'trainees'), traineeData);
    } catch (error) {
      console.error('Error adding trainee:', error);
      throw error;
    }
  };

  const updateTrainee = async (traineeId: string, updates: Partial<Trainee>) => {
    try {
      await updateDoc(doc(db, 'trainees', traineeId), updates);
    } catch (error) {
      console.error('Error updating trainee:', error);
      throw error;
    }
  };

  const archiveTrainee = async (traineeId: string) => {
    try {
      await updateDoc(doc(db, 'trainees', traineeId), { isActive: false });
    } catch (error) {
      console.error('Error archiving trainee:', error);
      throw error;
    }
  };

  const deleteTrainee = async (traineeId: string) => {
    try {
      await deleteDoc(doc(db, 'trainees', traineeId));
    } catch (error) {
      console.error('Error deleting trainee:', error);
      throw error;
    }
  };

  return {
    trainees,
    loading,
    addTrainee,
    updateTrainee,
    archiveTrainee,
    deleteTrainee,
  };
};