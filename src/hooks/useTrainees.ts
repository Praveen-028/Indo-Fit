import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  writeBatch, // <-- NEW: Import for atomic operations
  getDocs,    // <-- NEW: Import for querying related documents
  query,      // <-- NEW: Import for creating queries
  where       // <-- NEW: Import for filtering queries
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trainee } from '../types';

// Define a type for Plans to use in getRelatedPlansQuery
type PlanCollection = 'workoutPlans' | 'dietPlans';

export const useTrainees = () => {
  const [allTrainees, setAllTrainees] = useState<Trainee[]>([]); // Store all trainees
  const [loading, setLoading] = useState(true);

  // Utility function to query related plans
  const getRelatedPlansQuery = async (traineeId: string, batch: ReturnType<typeof writeBatch>, action: 'archive' | 'unarchive' | 'delete') => {
    const planCollections: PlanCollection[] = ['workoutPlans', 'dietPlans'];
    const updateField = action === 'archive' ? { isActive: false } : { isActive: true };

    for (const collectionName of planCollections) {
      // Create a query to find all plans belonging to the trainee
      const q = query(collection(db, collectionName), where('traineeId', '==', traineeId));
      const snapshot = await getDocs(q);

      snapshot.docs.forEach((planDoc) => {
        if (action === 'delete') {
          // If deleting the trainee, delete the plans too
          batch.delete(planDoc.ref);
        } else {
          // If archiving/unarchiving, update the plans' status
          batch.update(planDoc.ref, updateField);
        }
      });
    }
  };

  // NEW: Function to check and auto-archive expired memberships
  const checkAndArchiveExpiredMemberships = async () => {
    try {
      const now = new Date();
      const batch = writeBatch(db);
      let hasUpdates = false;

      // Find active trainees with expired memberships (more than 1 month past expiry)
      const expiredTrainees = allTrainees.filter(trainee => {
        if (trainee.isActive === false) return false; // Skip already archived
        
        const membershipEndDate = new Date(trainee.membershipEndDate);
        const oneMonthAfterExpiry = new Date(membershipEndDate);
        oneMonthAfterExpiry.setMonth(oneMonthAfterExpiry.getMonth() + 1);
        
        return now > oneMonthAfterExpiry;
      });

      console.log(`Found ${expiredTrainees.length} memberships expired for more than 1 month`);

      for (const trainee of expiredTrainees) {
        const traineeRef = doc(db, 'trainees', trainee.id);
        
        // Archive the trainee
        batch.update(traineeRef, { 
          isActive: false,
          autoArchivedAt: new Date(),
          autoArchivedReason: 'Membership expired for more than 1 month'
        });
        
        // Archive related plans
        await getRelatedPlansQuery(trainee.id, batch, 'archive');
        hasUpdates = true;

        console.log(`Auto-archiving trainee: ${trainee.name} (ID: ${trainee.id})`);
      }

      // Commit batch if there are updates
      if (hasUpdates) {
        await batch.commit();
        console.log(`Auto-archived ${expiredTrainees.length} expired memberships`);
      }

    } catch (error) {
      console.error('Error auto-archiving expired memberships:', error);
    }
  };

  // NEW: Function to run periodic checks
  const startPeriodicExpiryCheck = () => {
    // Run immediately when hook initializes
    checkAndArchiveExpiredMemberships();

    // Set up interval to run every 24 hours (86400000 ms)
    const intervalId = setInterval(() => {
      checkAndArchiveExpiredMemberships();
    }, 24 * 60 * 60 * 1000); // 24 hours

    return intervalId;
  };

  useEffect(() => {
    // Fetches ALL trainees (active and archived)
    const q = collection(db, 'trainees'); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const traineesData = snapshot.docs.map(doc => ({
        id: doc.id,
        // Assuming your Firestore documents have all necessary fields, including 'isActive'
        ...doc.data(), 
        membershipStartDate: doc.data().membershipStartDate?.toDate(),
        membershipEndDate: doc.data().membershipEndDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        autoArchivedAt: doc.data().autoArchivedAt?.toDate(), // NEW: Handle auto-archive timestamp
      })) as Trainee[];
      
      setAllTrainees(traineesData); 
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // NEW: Start periodic expiry check when trainees data is loaded
  useEffect(() => {
    if (!loading && allTrainees.length > 0) {
      const intervalId = startPeriodicExpiryCheck();
      
      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [loading, allTrainees.length]);
  
  // Derived state: Filter active and archived members
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

  // ------------------------------------------------------------------
  // UPDATED: ARCHIVE TRAINEE (Archives Trainee, WorkoutPlans, and DietPlans)
  // ------------------------------------------------------------------
  const archiveTrainee = async (traineeId: string) => {
    const batch = writeBatch(db);
    const traineeRef = doc(db, 'trainees', traineeId);
    
    try {
      // 1. Archive the Trainee document (manual archive)
      batch.update(traineeRef, { 
        isActive: false,
        manualArchivedAt: new Date() // Mark as manually archived
      });
      
      // 2. Archive related Plans and add to the same batch
      await getRelatedPlansQuery(traineeId, batch, 'archive');

      // 3. Commit the batch: all or nothing
      await batch.commit();

    } catch (error) {
      console.error('Error archiving trainee and plans:', error);
      throw error;
    }
  };

  // ------------------------------------------------------------------
  // UPDATED: UNARCHIVE TRAINEE (Unarchives Trainee, WorkoutPlans, and DietPlans)
  // ------------------------------------------------------------------
  const unarchiveTrainee = async (traineeId: string) => {
    const batch = writeBatch(db);
    const traineeRef = doc(db, 'trainees', traineeId);

    try {
      // 1. Unarchive the Trainee document
      batch.update(traineeRef, { 
        isActive: true,
        unarchivedAt: new Date(),
        // Clear archive timestamps when unarchiving
        autoArchivedAt: null,
        autoArchivedReason: null,
        manualArchivedAt: null
      });
      
      // 2. Unarchive related Plans and add to the same batch
      await getRelatedPlansQuery(traineeId, batch, 'unarchive');

      // 3. Commit the batch: all or nothing
      await batch.commit();

    } catch (error) {
      console.error('Error unarchiving trainee and plans:', error);
      throw error;
    }
  };

  // ------------------------------------------------------------------
  // UPDATED: DELETE TRAINEE (Deletes Trainee, WorkoutPlans, and DietPlans)
  // ------------------------------------------------------------------
  const deleteTrainee = async (traineeId: string) => {
    const batch = writeBatch(db);
    const traineeRef = doc(db, 'trainees', traineeId);

    if (!traineeRef) {
      console.error(`Trainee with ID ${traineeId} not found.`);
      return;
    }

    try {
      // 1. Delete the Trainee document
      batch.delete(traineeRef);
      
      // 2. Delete related Plans and add to the same batch
      await getRelatedPlansQuery(traineeId, batch, 'delete');
      // NOTE: Attendance collection is intentionally skipped by the utility function

      // 3. Commit the batch: all or nothing
      await batch.commit();

    } catch (error) {
      console.error('Error deleting trainee and plans:', error);
      throw error;
    }
  };

  // NEW: Manual function to trigger expiry check (useful for testing or manual triggers)
  const manualExpiryCheck = async () => {
    await checkAndArchiveExpiredMemberships();
  };

  return {
    trainees: activeTrainees, // Active list for main view
    archivedTrainees,          // Archived list for archived view
    loading,
    addTrainee,
    updateTrainee,            // Make sure this is exported
    archiveTrainee,
    unarchiveTrainee,          // Exposed unarchive function
    deleteTrainee,
    manualExpiryCheck,        // NEW: Expose manual expiry check function
  };
};