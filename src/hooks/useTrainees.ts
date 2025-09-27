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
import { Trainee } from '../types';

type PlanCollection = 'workoutPlans' | 'dietPlans';

export const useTrainees = () => {
  const [allTrainees, setAllTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);

  // Utility function to clean data before saving to Firestore
  const cleanDataForFirestore = (data: any) => {
    const cleaned = { ...data };
    
    // Remove undefined values and replace with null or remove the field entirely
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        delete cleaned[key]; // Remove undefined fields entirely
      }
    });
    
    return cleaned;
  };

  // Utility function to query related plans
  const getRelatedPlansQuery = async (traineeId: string, batch: ReturnType<typeof writeBatch>, action: 'archive' | 'unarchive' | 'delete') => {
    const planCollections: PlanCollection[] = ['workoutPlans', 'dietPlans'];
    const updateField = action === 'archive' ? { isActive: false } : { isActive: true };

    for (const collectionName of planCollections) {
      const q = query(collection(db, collectionName), where('traineeId', '==', traineeId));
      const snapshot = await getDocs(q);

      snapshot.docs.forEach((planDoc) => {
        if (action === 'delete') {
          batch.delete(planDoc.ref);
        } else {
          batch.update(planDoc.ref, updateField);
        }
      });
    }
  };

  const checkAndArchiveExpiredMemberships = async () => {
    try {
      const now = new Date();
      const batch = writeBatch(db);
      let hasUpdates = false;

      const expiredTrainees = allTrainees.filter(trainee => {
        if (trainee.isActive === false) return false;
        
        const membershipEndDate = new Date(trainee.membershipEndDate);
        const oneMonthAfterExpiry = new Date(membershipEndDate);
        oneMonthAfterExpiry.setMonth(oneMonthAfterExpiry.getMonth() + 1);
        
        return now > oneMonthAfterExpiry;
      });

      console.log(`Found ${expiredTrainees.length} memberships expired for more than 1 month`);

      for (const trainee of expiredTrainees) {
        const traineeRef = doc(db, 'trainees', trainee.id);
        
        batch.update(traineeRef, { 
          isActive: false,
          autoArchivedAt: new Date(),
          autoArchivedReason: 'Membership expired for more than 1 month'
        });
        
        await getRelatedPlansQuery(trainee.id, batch, 'archive');
        hasUpdates = true;

        console.log(`Auto-archiving trainee: ${trainee.name} (ID: ${trainee.id})`);
      }

      if (hasUpdates) {
        await batch.commit();
        console.log(`Auto-archived ${expiredTrainees.length} expired memberships`);
      }

    } catch (error) {
      console.error('Error auto-archiving expired memberships:', error);
    }
  };

  const startPeriodicExpiryCheck = () => {
    checkAndArchiveExpiredMemberships();

    const intervalId = setInterval(() => {
      checkAndArchiveExpiredMemberships();
    }, 24 * 60 * 60 * 1000);

    return intervalId;
  };

  useEffect(() => {
    const q = collection(db, 'trainees'); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const traineesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(), 
        membershipStartDate: doc.data().membershipStartDate?.toDate(),
        membershipEndDate: doc.data().membershipEndDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        autoArchivedAt: doc.data().autoArchivedAt?.toDate(),
      })) as Trainee[];
      
      setAllTrainees(traineesData); 
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && allTrainees.length > 0) {
      const intervalId = startPeriodicExpiryCheck();
      return () => clearInterval(intervalId);
    }
  }, [loading, allTrainees.length]);
  
  const activeTrainees = allTrainees.filter(t => t.isActive !== false); 
  const archivedTrainees = allTrainees.filter(t => t.isActive === false);

  // FIXED: Clean data before saving to Firestore
  const addTrainee = async (traineeData: Omit<Trainee, 'id'>) => {
    try {
      // Prepare the data with defaults and clean undefined values
      const dataToSave = {
        ...traineeData,
        isActive: true,
        createdAt: new Date(),
        // Only include assignedTrainerId if specialTraining is enabled and trainerId exists
        ...(traineeData.specialTraining && traineeData.assignedTrainerId ? 
          { assignedTrainerId: traineeData.assignedTrainerId } : 
          {}
        )
      };

      // Remove any undefined values
      const cleanedData = cleanDataForFirestore(dataToSave);
      
      console.log('Saving trainee data:', cleanedData); // Debug log
      
      await addDoc(collection(db, 'trainees'), cleanedData);
    } catch (error) {
      console.error('Error adding trainee:', error);
      throw error;
    }
  };

  // FIXED: Clean data before updating in Firestore
  const updateTrainee = async (traineeId: string, updates: Partial<Trainee>) => {
    try {
      // Handle assignedTrainerId based on specialTraining
      const updatesToSave = { ...updates };
      
      // If specialTraining is being disabled, remove assignedTrainerId
      if (updates.specialTraining === false) {
        updatesToSave.assignedTrainerId = null; // Use null instead of undefined
      }
      // If specialTraining is enabled but no trainer assigned, don't include the field
      else if (updates.specialTraining === true && !updates.assignedTrainerId) {
        delete updatesToSave.assignedTrainerId;
      }

      // Clean the data
      const cleanedUpdates = cleanDataForFirestore(updatesToSave);
      
      console.log('Updating trainee with data:', cleanedUpdates); // Debug log
      
      await updateDoc(doc(db, 'trainees', traineeId), cleanedUpdates);
    } catch (error) {
      console.error('Error updating trainee:', error);
      throw error;
    }
  };

  const archiveTrainee = async (traineeId: string) => {
    const batch = writeBatch(db);
    const traineeRef = doc(db, 'trainees', traineeId);
    
    try {
      batch.update(traineeRef, { 
        isActive: false,
        manualArchivedAt: new Date()
      });
      
      await getRelatedPlansQuery(traineeId, batch, 'archive');
      await batch.commit();

    } catch (error) {
      console.error('Error archiving trainee and plans:', error);
      throw error;
    }
  };

  const unarchiveTrainee = async (traineeId: string) => {
    const batch = writeBatch(db);
    const traineeRef = doc(db, 'trainees', traineeId);

    try {
      batch.update(traineeRef, { 
        isActive: true,
        unarchivedAt: new Date(),
        autoArchivedAt: null,
        autoArchivedReason: null,
        manualArchivedAt: null
      });
      
      await getRelatedPlansQuery(traineeId, batch, 'unarchive');
      await batch.commit();

    } catch (error) {
      console.error('Error unarchiving trainee and plans:', error);
      throw error;
    }
  };

  const deleteTrainee = async (traineeId: string) => {
    const batch = writeBatch(db);
    const traineeRef = doc(db, 'trainees', traineeId);

    if (!traineeRef) {
      console.error(`Trainee with ID ${traineeId} not found.`);
      return;
    }

    try {
      batch.delete(traineeRef);
      await getRelatedPlansQuery(traineeId, batch, 'delete');
      await batch.commit();

    } catch (error) {
      console.error('Error deleting trainee and plans:', error);
      throw error;
    }
  };

  const manualExpiryCheck = async () => {
    await checkAndArchiveExpiredMemberships();
  };

  return {
    trainees: activeTrainees,
    archivedTrainees,
    loading,
    addTrainee,
    updateTrainee,
    archiveTrainee,
    unarchiveTrainee,
    deleteTrainee,
    manualExpiryCheck,
  };
};