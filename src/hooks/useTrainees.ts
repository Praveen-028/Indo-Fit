import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trainee } from '../types';

export const useTrainees = () => {
  const [allTrainees, setAllTrainees] = useState<Trainee[]>([]); // Store all trainees
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetches ALL trainees (active and archived)
    const q = collection(db, 'trainees'); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const traineesData = snapshot.docs.map(doc => ({
        id: doc.id,
        // Assuming your Firestore documents have all necessary fields, including 'isActive' (optional, defaults to active)
        ...doc.data(), 
        membershipStartDate: doc.data().membershipStartDate?.toDate(),
        membershipEndDate: doc.data().membershipEndDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Trainee[];
      
      setAllTrainees(traineesData); 
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  // Derived state: Filter active and archived members
  // Assumes isActive: true or lack of the field means the trainee is active.
  const activeTrainees = allTrainees.filter(t => t.isActive !== false); 
  const archivedTrainees = allTrainees.filter(t => t.isActive === false);


  const addTrainee = async (traineeData: Omit<Trainee, 'id'>) => {
    try {
      // Ensure new trainees are marked as active by default
      await addDoc(collection(db, 'trainees'), { ...traineeData, isActive: true, createdAt: new Date() });
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
      // Set isActive to false to archive
      await updateDoc(doc(db, 'trainees', traineeId), { isActive: false });
    } catch (error) {
      console.error('Error archiving trainee:', error);
      throw error;
    }
  };

  // NEW: Function to unarchive a trainee
  const unarchiveTrainee = async (traineeId: string) => {
    try {
      // Set isActive to true to move them back to the active list
      await updateDoc(doc(db, 'trainees', traineeId), { isActive: true });
    } catch (error) {
      console.error('Error unarchiving trainee:', error);
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
    trainees: activeTrainees, // Active list for main view
    archivedTrainees,         // Archived list for archived view
    loading,
    addTrainee,
    updateTrainee,
    archiveTrainee,
    unarchiveTrainee,         // Exposed unarchive function
    deleteTrainee,
  };
};