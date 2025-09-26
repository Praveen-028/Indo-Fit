import React, { useState, useEffect } from 'react';
import { Calendar, Users, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTrainees } from '../hooks/useTrainees';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AttendanceRecord } from '../types';
import { format, startOfDay, endOfDay, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addMonths, subMonths, addYears, subYears, getDaysInMonth, getDay } from 'date-fns';
import { isToday, isPastDate, isFutureDate } from '../utils/traineeUtils';

export const AttendanceManager: React.FC = () => {
  const { trainees } = useTrainees();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [loading, setLoading] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [selectedDayRecords, setSelectedDayRecords] = useState<AttendanceRecord[]>([]);

  // Load attendance records for selected date/period
  useEffect(() => {
    let startDate: Date;
    let endDate: Date;

    switch (view) {
      case 'daily':
        startDate = startOfDay(selectedDate);
        endDate = endOfDay(selectedDate);
        break;
      case 'weekly':
        startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
        endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
        break;
      case 'monthly':
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
        break;
      case 'yearly':
        startDate = startOfYear(selectedDate);
        endDate = endOfYear(selectedDate);
        break;
    }

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
    // Only allow marking attendance for today
    if (!isToday(selectedDate)) {
      alert('Attendance can only be marked for today.');
      return;
    }
    
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

  const getAttendanceStatus = (traineeId: string, date?: Date) => {
    const targetDate = date || selectedDate;
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const record = attendanceRecords.find(
      record => record.traineeId === traineeId && 
               format(record.date, 'yyyy-MM-dd') === dateStr
    );
    return record?.present;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'daily':
        setSelectedDate(direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
        break;
      case 'weekly':
        setSelectedDate(direction === 'prev' ? subDays(selectedDate, 7) : addDays(selectedDate, 7));
        break;
      case 'monthly':
        setSelectedDate(direction === 'prev' ? subMonths(selectedDate, 1) : addMonths(selectedDate, 1));
        break;
      case 'yearly':
        setSelectedDate(direction === 'prev' ? subYears(selectedDate, 1) : addYears(selectedDate, 1));
        break;
    }
  };

  const canMarkAttendance = isToday(selectedDate);

  const getStats = () => {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalRecords = 0;

    switch (view) {
      case 'weekly':
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekRecords = attendanceRecords.filter(record => 
          record.date >= weekStart && record.date <= weekEnd
        );
        totalPresent = weekRecords.filter(record => record.present).length;
        totalAbsent = weekRecords.filter(record => !record.present).length;
        totalRecords = weekRecords.length;
        break;
      
      case 'monthly':
        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);
        const monthRecords = attendanceRecords.filter(record => 
          record.date >= monthStart && record.date <= monthEnd
        );
        totalPresent = monthRecords.filter(record => record.present).length;
        totalAbsent = monthRecords.filter(record => !record.present).length;
        totalRecords = monthRecords.length;
        break;
      
      case 'yearly':
        const yearStart = startOfYear(selectedDate);
        const yearEnd = endOfYear(selectedDate);
        const yearRecords = attendanceRecords.filter(record => 
          record.date >= yearStart && record.date <= yearEnd
        );
        totalPresent = yearRecords.filter(record => record.present).length;
        totalAbsent = yearRecords.filter(record => !record.present).length;
        totalRecords = yearRecords.length;
        break;
      
      default:
        return null;
    }

    return { totalPresent, totalAbsent, totalRecords };
  };

  const handleDayClick = (date: Date) => {
    const dayRecords = attendanceRecords.filter(record => 
      format(record.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    setSelectedDayDate(date);
    setSelectedDayRecords(dayRecords);
    setShowDayModal(true);
  };

  const renderMonthlyCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const startingDayOfWeek = getDay(firstDayOfMonth);
    const adjustedStartingDay = startingDayOfWeek === 0 ? 7 : startingDayOfWeek;

    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 1; i < adjustedStartingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 sm:h-24"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const dayRecords = attendanceRecords.filter(record => 
        format(record.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      const presentCount = dayRecords.filter(record => record.present).length;
      const absentCount = dayRecords.filter(record => !record.present).length;
      const totalCount = dayRecords.length;

      days.push(
        <div
          key={day}
          className={`h-20 sm:h-24 border border-white/20 p-1 sm:p-2 cursor-pointer hover:bg-white/10 transition-colors ${
            isToday(date) ? 'bg-blue-500/20 border-blue-400' : ''
          }`}
          onClick={() => handleDayClick(date)}
        >
          <div className="text-xs sm:text-sm font-medium text-ivory-100 mb-1">{day}</div>
          {totalCount > 0 && (
            <div className="space-y-1">
              <div className="text-xs flex items-center justify-between">
                <span className="text-green-400">P: {presentCount}</span>
                <span className="text-red-400">A: {absentCount}</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-1">
                <div
                  className="bg-green-500 h-1 rounded-full"
                  style={{ width: totalCount > 0 ? `${(presentCount / totalCount) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 sm:p-6">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Day headers */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center font-medium text-green-200 p-2 text-xs sm:text-sm">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const renderYearlyView = () => {
    const months = [];
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(selectedDate.getFullYear(), month, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthRecords = attendanceRecords.filter(record => 
        record.date >= monthStart && record.date <= monthEnd
      );
      const presentCount = monthRecords.filter(record => record.present).length;
      const absentCount = monthRecords.filter(record => !record.present).length;
      const totalCount = monthRecords.length;

      months.push(
        <div
          key={month}
          className="bg-white/10 border border-white/20 rounded-lg p-4 cursor-pointer hover:bg-white/15 transition-colors"
          onClick={() => {
            setSelectedDate(monthDate);
            setView('monthly');
          }}
        >
          <div className="text-center">
            <h3 className="font-semibold text-ivory-100 mb-2">{format(monthDate, 'MMM')}</h3>
            {totalCount > 0 ? (
              <div className="space-y-2">
                <div className="text-sm">
                  <div className="text-green-400">Present: {presentCount}</div>
                  <div className="text-red-400">Absent: {absentCount}</div>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: totalCount > 0 ? `${(presentCount / totalCount) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">No records</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {months}
      </div>
    );
  };

  const stats = getStats();

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
        <div className="flex items-center space-x-1 flex-wrap gap-1">
          {['daily', 'weekly', 'monthly', 'yearly'].map((viewType) => (
            <button
              key={viewType}
              onClick={() => setView(viewType as any)}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-all capitalize ${
                view === viewType
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white/10 text-ivory-200 hover:bg-white/20'
              } text-sm`}
            >
              {viewType}
            </button>
          ))}
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
              {view === 'daily' && format(selectedDate, 'EEEE, MMMM d, yyyy')}
              {view === 'weekly' && `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`}
              {view === 'monthly' && format(selectedDate, 'MMMM yyyy')}
              {view === 'yearly' && format(selectedDate, 'yyyy')}
            </h2>
            
            {view === 'daily' && !canMarkAttendance && (
              <p className="text-yellow-400 text-sm mt-1">
                {isPastDate(selectedDate) ? 'Past attendance (view only)' : 'Future date (view only)'}
              </p>
            )}
            
            {stats && (
              <div className="flex items-center justify-center space-x-3 sm:space-x-6 mt-2 text-xs sm:text-sm">
                <span className="text-green-400">Present: {stats.totalPresent}</span>
                <span className="text-red-400">Absent: {stats.totalAbsent}</span>
                <span className="text-yellow-400">Total: {stats.totalRecords}</span>
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

      {/* Content based on view */}
      {view === 'daily' && (
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
                        disabled={loading || !canMarkAttendance}
                        className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm ${
                          attendanceStatus === true
                            ? 'bg-green-600 text-white'
                            : canMarkAttendance 
                              ? 'bg-white/10 text-ivory-200 hover:bg-green-600/20 hover:text-green-300'
                              : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                        } ${!canMarkAttendance ? 'opacity-50' : ''}`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Present</span>
                      </button>
                      
                      <button
                        onClick={() => markAttendance(trainee.id, trainee.name, false)}
                        disabled={loading || !canMarkAttendance}
                        className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm ${
                          attendanceStatus === false
                            ? 'bg-red-600 text-white'
                            : canMarkAttendance
                              ? 'bg-white/10 text-ivory-200 hover:bg-red-600/20 hover:text-red-300'
                              : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                        } ${!canMarkAttendance ? 'opacity-50' : ''}`}
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
      )}

      {view === 'weekly' && (
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

      {view === 'monthly' && renderMonthlyCalendar()}

      {view === 'yearly' && renderYearlyView()}

      {/* Day Detail Modal */}
      {showDayModal && selectedDayDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-white">
                {format(selectedDayDate, 'EEEE, MMMM d, yyyy')}
              </h2>
              <button
                onClick={() => setShowDayModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {selectedDayRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-ivory-200">No attendance records for this day</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {selectedDayRecords.filter(r => r.present).length}
                      </div>
                      <div className="text-sm text-green-300">Present</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {selectedDayRecords.filter(r => !r.present).length}
                      </div>
                      <div className="text-sm text-red-300">Absent</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {selectedDayRecords.map((record) => (
                      <div
                        key={record.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          record.present 
                            ? 'bg-green-500/20 border border-green-500/30' 
                            : 'bg-red-500/20 border border-red-500/30'
                        }`}
                      >
                        <span className="text-ivory-100 font-medium">{record.traineeName}</span>
                        <span className={`flex items-center space-x-1 text-sm ${
                          record.present ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {record.present ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          <span>{record.present ? 'Present' : 'Absent'}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};