import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, Check, X, ChevronLeft, ChevronRight, Search, Download, FileText } from 'lucide-react';
import { useTrainees } from '../hooks/useTrainees';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FIXED_USER_UID } from '../lib/firebase';
import { AttendanceRecord } from '../types';
import { format, startOfDay, endOfDay, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addMonths, subMonths, addYears, subYears, getDaysInMonth, getDay } from 'date-fns';
import { isToday, isPastDate, isFutureDate } from '../utils/traineeUtils';
import jsPDF from 'jspdf';

export const AttendanceManager: React.FC = () => {
  const { trainees } = useTrainees();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [loading, setLoading] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [selectedDayRecords, setSelectedDayRecords] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter trainees based on search query
  const filteredTrainees = useMemo(() => {
    if (!searchQuery.trim()) return trainees;
    
    const query = searchQuery.toLowerCase().trim();
    return trainees.filter(trainee =>
      trainee.name.toLowerCase().includes(query) ||
      trainee.phoneNumber.includes(query) ||
      trainee.uniqueId.toLowerCase().includes(query)
    );
  }, [trainees, searchQuery]);

  // Add branding to PDF
  const addBranding = (pdf: jsPDF) => {
    // Header background
    pdf.setFillColor(6, 78, 59); // Green color
    pdf.rect(0, 0, 210, 40, 'F');
    
    // Logo area
    pdf.setFillColor(251, 191, 36); // Yellow color
    pdf.rect(15, 10, 20, 20, 'F');
    
    // Logo text
    pdf.setTextColor(6, 78, 59);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('IF', 25, 23);
    
    // Gym name
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INDOFIT GYM', 45, 25);
    
    // Subtitle
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Physique LAB7.0', 45, 32);
    
    // Reset colors
    pdf.setTextColor(0, 0, 0);
  };

  // Export day attendance to PDF
  const exportDayAttendance = async (date: Date, records: AttendanceRecord[]) => {
    const pdf = new jsPDF();
    
    // Add branding
    addBranding(pdf);
    
    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Daily Attendance Report', 20, 60);
    
    // Date and subtitle
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${format(date, 'EEEE, MMMM d, yyyy')}`, 20, 75);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 85);
    
    // Summary stats
    const presentCount = records.filter(r => r.present).length;
    const absentCount = records.filter(r => !r.present).length;
    const totalCount = records.length;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary:', 20, 105);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Attendance Records: ${totalCount}`, 20, 115);
    pdf.text(`Present: ${presentCount}`, 20, 125);
    pdf.text(`Absent: ${absentCount}`, 20, 135);
    
    if (totalCount > 0) {
      const attendancePercentage = ((presentCount / totalCount) * 100).toFixed(1);
      pdf.text(`Attendance Rate: ${attendancePercentage}%`, 20, 145);
    }
    
    let y = 165;
    
    if (records.length === 0) {
      pdf.text('No attendance records found for this date.', 20, y);
    } else {
      // Table headers
      pdf.setFont('helvetica', 'bold');
      pdf.text('Name', 20, y);
      pdf.text('Status', 120, y);
      y += 10;
      
      // Draw line under headers
      pdf.line(20, y, 190, y);
      y += 10;
      
      // Sort records by name
      const sortedRecords = [...records].sort((a, b) => a.traineeName.localeCompare(b.traineeName));
      
      pdf.setFont('helvetica', 'normal');
      sortedRecords.forEach((record) => {
        // Check if we need a new page
        if (y > 270) {
          pdf.addPage();
          addBranding(pdf);
          y = 60;
          
          // Re-add headers on new page
          pdf.setFont('helvetica', 'bold');
          pdf.text('Name', 20, y);
          pdf.text('Status', 120, y);
          y += 10;
          pdf.line(20, y, 190, y);
          y += 10;
          pdf.setFont('helvetica', 'normal');
        }
        
        pdf.text(record.traineeName, 20, y);
        
        // Set color for status
        if (record.present) {
          pdf.setTextColor(0, 128, 0); // Green
          pdf.text('Present', 120, y);
        } else {
          pdf.setTextColor(255, 0, 0); // Red
          pdf.text('Absent', 120, y);
        }
        
        pdf.setTextColor(0, 0, 0); // Reset to black
        y += 8;
      });
    }
    
    // Download the PDF
    const fileName = `attendance-${format(date, 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);
  };

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
          className={`h-20 sm:h-24 border border-white/20 p-1 sm:p-2 cursor-pointer hover:bg-white/10 transition-colors group relative ${
            isToday(date) ? 'bg-blue-500/20 border-blue-400' : ''
          }`}
          onClick={() => handleDayClick(date)}
        >
          <div className="text-xs sm:text-sm font-medium text-ivory-100 mb-1">{day}</div>
          {totalCount > 0 && (
            <>
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
              {/* Export button - shows on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  exportDayAttendance(date, dayRecords);
                }}
                className="absolute top-1 right-1 p-1 bg-blue-500/80 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
                title="Export attendance for this day"
              >
                <Download className="w-3 h-3" />
              </button>
            </>
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
          className="bg-white/10 border border-white/20 rounded-lg p-4 cursor-pointer hover:bg-white/15 transition-colors group"
          onClick={() => {
            setSelectedDate(monthDate);
            setView('monthly');
          }}
        >
          <div className="text-center">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-ivory-100">{format(monthDate, 'MMM')}</h3>
              {totalCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Export all days in the month that have attendance
                    const daysWithAttendance = new Set(
                      monthRecords.map(record => format(record.date, 'yyyy-MM-dd'))
                    );
                    
                    if (daysWithAttendance.size === 1) {
                      // If only one day has attendance, export that day
                      const singleDay = new Date([...daysWithAttendance][0]);
                      const dayRecords = monthRecords.filter(record => 
                        format(record.date, 'yyyy-MM-dd') === format(singleDay, 'yyyy-MM-dd')
                      );
                      exportDayAttendance(singleDay, dayRecords);
                    } else {
                      // Navigate to monthly view for multiple days
                      setSelectedDate(monthDate);
                      setView('monthly');
                    }
                  }}
                  className="p-1 bg-blue-500/80 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
                  title="View month details"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}
            </div>
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

      {/* Search Bar - Only show in daily view */}
      {view === 'daily' && (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ivory-300" />
            <input
              type="text"
              placeholder="Search trainees by name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-ivory-100 placeholder-ivory-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
            />
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-ivory-300">
              Found {filteredTrainees.length} trainee{filteredTrainees.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

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
          {filteredTrainees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-ivory-200">
                {searchQuery ? 'No trainees found matching your search' : 'No trainees found'}
              </p>
            </div>
          ) : (
            filteredTrainees.map((trainee) => {
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
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportDayAttendance(selectedDayDate, selectedDayRecords)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Export attendance"
                >
                  <Download className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setShowDayModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
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
                    {selectedDayRecords
                      .sort((a, b) => a.traineeName.localeCompare(b.traineeName))
                      .map((record) => (
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