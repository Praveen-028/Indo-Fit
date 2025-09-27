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
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trainee } from '../types';

type PlanCollection = 'workoutPlans' | 'dietPlans';

export const useTrainees = () => {
  const [allTrainees, setAllTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Utility: Update/Delete related plans when trainee is archived/unarchived/deleted
  const getRelatedPlansQuery = async (
    traineeId: string,
    batch: ReturnType<typeof writeBatch>,
    action: 'archive' | 'unarchive' | 'delete'
  ) => {
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

  // --- Auto-archive expired memberships (1+ month past expiry)
  const checkAndArchiveExpiredMemberships = async () => {
    try {
      const now = new Date();
      const batch = writeBatch(db);
      let hasUpdates = false;

      const expiredTrainees = allTrainees.filter((trainee) => {
        if (trainee.isActive === false) return false;

        const membershipEndDate = new Date(trainee.membershipEndDate);
        const oneMonthAfterExpiry = new Date(membershipEndDate);
        oneMonthAfterExpiry.setMonth(oneMonthAfterExpiry.getMonth() + 1);

        return now > oneMonthAfterExpiry;
      });

      for (const trainee of expiredTrainees) {
        const traineeRef = doc(db, 'trainees', trainee.id);

        batch.update(traineeRef, {
          isActive: false,
          autoArchivedAt: new Date(),
          autoArchivedReason: 'Membership expired for more than 1 month',
        });

        await getRelatedPlansQuery(trainee.id, batch, 'archive');
        hasUpdates = true;
      }

      if (hasUpdates) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error auto-archiving expired memberships:', error);
    }
  };

  // --- Lifecycle: subscribe + start periodic check
  useEffect(() => {
    const q = collection(db, 'trainees');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const traineesData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Trainee[];

      setAllTrainees(traineesData);
      setLoading(false);
    });

    // Run periodic expiry checks every 24h
    checkAndArchiveExpiredMemberships();
    const intervalId = setInterval(checkAndArchiveExpiredMemberships, 24 * 60 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  // --- Derived lists
  const trainees = allTrainees.filter((t) => t.isActive);
  const archivedTrainees = allTrainees.filter((t) => !t.isActive);

  // --- CRUD operations
  const addTrainee = async (trainee: Omit<Trainee, 'id'>) => {
    await addDoc(collection(db, 'trainees'), trainee);
  };

  const updateTrainee = async (traineeId: string, updates: Partial<Trainee>) => {
    const traineeRef = doc(db, 'trainees', traineeId);
    await updateDoc(traineeRef, updates);
  };

  const archiveTrainee = async (traineeId: string) => {
    const batch = writeBatch(db);
    const traineeRef = doc(db, 'trainees', traineeId);

    batch.update(traineeRef, { isActive: false, archivedAt: new Date() });
    await getRelatedPlansQuery(traineeId, batch, 'archive');
    await batch.commit();
  };

  const unarchiveTrainee = async (traineeId: string) => {
    const batch = writeBatch(db);
    const traineeRef = doc(db, 'trainees', traineeId);

    batch.update(traineeRef, { isActive: true, unarchivedAt: new Date() });
    await getRelatedPlansQuery(traineeId, batch, 'unarchive');
    await batch.commit();
  };

  const deleteTrainee = async (traineeId: string) => {
    const batch = writeBatch(db);
    const traineeRef = doc(db, 'trainees', traineeId);

    batch.delete(traineeRef);
    await getRelatedPlansQuery(traineeId, batch, 'delete');
    await batch.commit();
  };

  return {
    trainees,
    archivedTrainees,
    allTrainees,
    loading,
    addTrainee,
    updateTrainee,
    archiveTrainee,
    unarchiveTrainee,
    deleteTrainee,
  };
};
