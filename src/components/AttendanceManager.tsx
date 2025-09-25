import React, { useState, useEffect } from 'react';
import { Calendar, Users, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTrainees } from '../hooks/useTrainees';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AttendanceRecord } from '../types';
import { format, startOfDay, endOfDay, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';

export const AttendanceManager: React.FC = () => {
  const { trainees } = useTrainees();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [view, setView] = useState<'daily' | 'weekly'>('daily');
  const [loading, setLoading] = useState(false);

  // Load attendance records for selected date/week
  useEffect(() => {
    const startDate = view === 'daily' 
      ? startOfDay(selectedDate)
      : startOfWeek(selectedDate, { weekStartsOn: 1 });
    
    const endDate = view === 'daily'
      ? endOfDay(selectedDate)
      : endOfWeek(selectedDate, { weekStartsOn: 1 });

    const q = query(
      collection(db, 'attendance'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as AttendanceRecord[];
      
      setAttendanceRecords(records);
    });

    return () => unsubscribe();
  }, [selectedDate, view]);

  const markAttendance = async (traineeId: string, traineeName: string, present: boolean) => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existingRecord = attendanceRecords.find(
        record => record.traineeId === traineeId && 
                 format(record.date, 'yyyy-MM-dd') === dateStr
      );

      if (existingRecord) {
        if (existingRecord.present === present) {
          // Remove record if clicking same status
          await deleteDoc(doc(db, 'attendance', existingRecord.id));
        } else {
          // Update existing record
          await updateDoc(doc(db, 'attendance', existingRecord.id), { present });
        }
      } else {
        // Create new record
        await addDoc(collection(db, 'attendance'), {
          traineeId,
          traineeName,
          date: selectedDate,
          present,
        });
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (traineeId: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const record = attendanceRecords.find(
      record => record.traineeId === traineeId && 
               format(record.date, 'yyyy-MM-dd') === dateStr
    );
    return record?.present;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (view === 'daily') {
      setSelectedDate(direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
    } else {
      setSelectedDate(direction === 'prev' ? subDays(selectedDate, 7) : addDays(selectedDate, 7));
    }
  };

  const getWeekStats = () => {
    if (view !== 'weekly') return null;
    
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    
    const weekRecords = attendanceRecords.filter(record => 
      record.date >= weekStart && record.date <= weekEnd
    );
    
    const totalPresent = weekRecords.filter(record => record.present).length;
    const totalAbsent = weekRecords.filter(record => !record.present).length;
    
    return { totalPresent, totalAbsent, totalRecords: weekRecords.length };
  };

  const weekStats = getWeekStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ivory-100">Attendance</h1>
            <p className="text-green-200 mt-1">Track daily attendance</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setView('daily')}
            className={`px-4 py-2 rounded-lg transition-all ${
              view === 'daily'
                ? 'bg-yellow-500 text-white'
                : 'bg-white/10 text-ivory-200 hover:bg-white/20'
            } text-sm sm:text-base`}
          >
            Daily
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 rounded-lg transition-all ${
              view === 'weekly'
                ? 'bg-yellow-500 text-white'
                : 'bg-white/10 text-ivory-200 hover:bg-white/20'
            } text-sm sm:text-base`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-ivory-200" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-ivory-100">
              {view === 'daily' 
                ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                : `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
              }
            </h2>
            
            {view === 'weekly' && weekStats && (
              <div className="flex items-center justify-center space-x-3 sm:space-x-6 mt-2 text-xs sm:text-sm">
                <span className="text-green-400">Present: {weekStats.totalPresent}</span>
                <span className="text-red-400">Absent: {weekStats.totalAbsent}</span>
                <span className="text-yellow-400">Total: {weekStats.totalRecords}</span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-ivory-200" />
          </button>
        </div>
      </div>

      {/* Attendance List */}
      {view === 'daily' ? (
        <div className="space-y-4">
          {trainees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-ivory-200">No trainees found</p>
            </div>
          ) : (
            trainees.map((trainee) => {
              const attendanceStatus = getAttendanceStatus(trainee.id);
              
              return (
                <div
                  key={trainee.id}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 sm:p-6 hover:bg-white/15 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-ivory-100">{trainee.name}</h3>
                      <p className="text-green-200 text-sm">{trainee.phoneNumber}</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        onClick={() => markAttendance(trainee.id, trainee.name, true)}
                        disabled={loading}
                        className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm ${
                          attendanceStatus === true
                            ? 'bg-green-600 text-white'
                            : 'bg-white/10 text-ivory-200 hover:bg-green-600/20 hover:text-green-300'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Present</span>
                      </button>
                      
                      <button
                        onClick={() => markAttendance(trainee.id, trainee.name, false)}
                        disabled={loading}
                        className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm ${
                          attendanceStatus === false
                            ? 'bg-red-600 text-white'
                            : 'bg-white/10 text-ivory-200 hover:bg-red-600/20 hover:text-red-300'
                        }`}
                      >
                        <X className="w-4 h-4" />
                        <span>Absent</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        // Weekly View - Show attendance grid
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 sm:p-6 overflow-x-auto">
          <div className="grid grid-cols-8 gap-2 sm:gap-4 min-w-[600px]">
            {/* Header row */}
            <div className="font-semibold text-ivory-100 text-sm sm:text-base">Trainee</div>
            {Array.from({ length: 7 }, (_, i) => {
              const date = addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i);
              return (
                <div key={i} className="text-center font-medium text-green-200 text-xs sm:text-sm">
                  {format(date, 'EEE')}<br />
                  <span className="text-xs">{format(date, 'M/d')}</span>
                </div>
              );
            })}
            
            {/* Trainee rows */}
            {trainees.map((trainee) => (
              <React.Fragment key={trainee.id}>
                <div className="text-ivory-100 font-medium truncate text-sm sm:text-base">{trainee.name}</div>
                {Array.from({ length: 7 }, (_, i) => {
                  const date = addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const record = attendanceRecords.find(
                    record => record.traineeId === trainee.id && 
                             format(record.date, 'yyyy-MM-dd') === dateStr
                  );
                  
                  return (
                    <div key={i} className="text-center">
                      {record ? (
                        <span className={`inline-flex w-5 h-5 sm:w-6 sm:h-6 rounded-full items-center justify-center text-xs ${
                          record.present ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {record.present ? '✓' : '✗'}
                        </span>
                      ) : (
                        <span className="inline-flex w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-400 items-center justify-center text-xs text-white">
                          -
                        </span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};