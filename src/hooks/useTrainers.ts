import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  writeBatch,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FIXED_USER_UID } from '../lib/firebase';
import { Trainer } from '../types';

export const useTrainers = () => {
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'trainers');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trainersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joiningDate: doc.data().joiningDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Trainer[];
      
      setAllTrainers(trainersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Derived state: Filter active and archived trainers
  const activeTrainers = allTrainers.filter(t => t.isActive !== false);
  const archivedTrainers = allTrainers.filter(t => t.isActive === false);

  const addTrainer = async (trainerData: Omit<Trainer, 'id'>) => {
    try {
      await addDoc(collection(db, 'trainers'), { 
        ...trainerData, 
        isActive: true, 
        createdAt: new Date() 
      });
    } catch (error) {
      console.error('Error adding trainer:', error);
      throw error;
    }
  };

  const updateTrainer = async (trainerId: string, updates: Partial<Trainer>) => {
    try {
      await updateDoc(doc(db, 'trainers', trainerId), updates);
    } catch (error) {
      console.error('Error updating trainer:', error);
      throw error;
    }
  };

  const archiveTrainer = async (trainerId: string) => {
    try {
      await updateDoc(doc(db, 'trainers', trainerId), { isActive: false });
    } catch (error) {
      console.error('Error archiving trainer:', error);
      throw error;
    }
  };

  const unarchiveTrainer = async (trainerId: string) => {
    try {
      await updateDoc(doc(db, 'trainers', trainerId), { isActive: true });
    } catch (error) {
      console.error('Error unarchiving trainer:', error);
      throw error;
    }
  };

  const deleteTrainer = async (trainerId: string) => {
    const batch = writeBatch(db);
    const trainerRef = doc(db, 'trainers', trainerId);

    if (!trainerRef) {
      console.error(`Trainer with ID ${trainerId} not found.`);
      return;
    }

    try {
      // Delete the trainer document
      batch.delete(trainerRef);
      
      // Delete related trainer attendance records
      const attendanceQuery = query(
        collection(db, 'trainerAttendance'), 
        where('trainerId', '==', trainerId)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      attendanceSnapshot.docs.forEach((attendanceDoc) => {
        batch.delete(attendanceDoc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting trainer:', error);
      throw error;
    }
  };

  return {
    trainers: activeTrainers,
    archivedTrainers,
    loading,
    addTrainer,
    updateTrainer,
    archiveTrainer,
    unarchiveTrainer,
    deleteTrainer,
  };
};